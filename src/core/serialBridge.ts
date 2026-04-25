// ESP32 ile Web Serial API üzerinden iletişim katmanı
// Tarayıcıdan (Chrome/Edge) doğrudan USB-C portuna ASCII satır komutları gönderir

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export type SerialEvent =
  | { type: 'status'; status: ConnectionStatus; message?: string }
  | { type: 'message'; line: string }
  | { type: 'ready' };

type Listener = (event: SerialEvent) => void;

const BAUD_RATE = 115200;
const TEXT_DECODER = new TextDecoder();
const TEXT_ENCODER = new TextEncoder();

export class SerialBridge {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private listeners: Set<Listener> = new Set();
  private status: ConnectionStatus = 'disconnected';
  private rxBuffer = '';
  private readLoopPromise: Promise<void> | null = null;
  private shuttingDown = false;

  // Tarayıcı Web Serial API destekliyor mu?
  static get isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  on(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  // Kullanıcıdan port seçmesini ister (browser permission prompt) ve bağlanır
  async connect(): Promise<void> {
    if (!SerialBridge.isSupported) {
      this.emitStatus('error', 'Bu tarayıcı Web Serial API desteklemiyor (Chrome/Edge gerekli).');
      return;
    }
    try {
      this.emitStatus('connecting');
      const port = await navigator.serial.requestPort();
      await this.openPort(port);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Bağlantı reddedildi';
      this.emitStatus('error', msg);
    }
  }

  // Tüm yetkilendirilmiş portları tarayıcıdan unutturur — otomatik bağlanmayı engeller
  async forgetAllPorts(): Promise<void> {
    if (!SerialBridge.isSupported) return;
    try {
      const ports = await navigator.serial.getPorts();
      for (const p of ports) {
        try { await (p as unknown as { forget?: () => Promise<void> }).forget?.(); } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
  }

  // Daha önce izin verilmiş portu otomatik açmayı dener (uygulama açılışında)
  async tryAutoConnect(): Promise<boolean> {
    if (!SerialBridge.isSupported) return false;
    // Zaten bağlı/bağlanmakta olan bir denemeyi bozmayalım
    if (this.status === 'connecting' || this.status === 'connected') return false;
    let signalledConnecting = false;
    try {
      const ports = await navigator.serial.getPorts();
      if (ports.length === 0) return false;
      this.emitStatus('connecting');
      signalledConnecting = true;
      await this.openPort(ports[0]);
      return true;
    } catch {
      // Kritik: 'connecting' yayınlandıysa mutlaka temizle — yoksa UI sonsuza kadar "Bağlanıyor…" kalır.
      // Otomatik denemede 'error' yerine sessizce 'disconnected' — retry döngüsü yeniden denesin.
      if (signalledConnecting) this.emitStatus('disconnected');
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.shuttingDown = true;
    try {
      if (this.reader) {
        try { await this.reader.cancel(); } catch { /* ignore */ }
      }
      if (this.writer) {
        try { this.writer.releaseLock(); } catch { /* ignore */ }
        this.writer = null;
      }
      if (this.readLoopPromise) {
        try { await this.readLoopPromise; } catch { /* ignore */ }
        this.readLoopPromise = null;
      }
      if (this.port) {
        try { await this.port.close(); } catch { /* ignore */ }
      }
    } finally {
      this.port = null;
      this.reader = null;
      this.shuttingDown = false;
      this.emitStatus('disconnected');
    }
  }

  // Yalın komut satırı gönderir — sonuna '\n' otomatik eklenir
  async send(command: string): Promise<void> {
    if (!this.writer) throw new Error('Bağlı değil');
    const line = command.endsWith('\n') ? command : command + '\n';
    await this.writer.write(TEXT_ENCODER.encode(line));
  }

  // ---- Protokol yardımcıları ----

  hit(channel: number, pulseMs?: number): Promise<void> {
    if (channel < 0) return Promise.resolve();  // WAIT vb. donanımsız enstrümanlar
    if (!this.writer) return Promise.resolve(); // Bağlı değilse sessizce yut (UI bağımsız çalışır)
    const cmd = pulseMs != null ? `HIT:${channel}:${pulseMs}` : `HIT:${channel}`;
    return this.send(cmd);
  }

  stop(): Promise<void> {
    return this.writer ? this.send('STOP') : Promise.resolve();
  }

  saveMelody(name: string): Promise<void> {
    return this.send(`SAVE:${name}`);
  }

  loadMelody(name: string): Promise<void> {
    return this.send(`LOAD:${name}`);
  }

  listMelodies(): Promise<void> {
    return this.send('LIST');
  }

  deleteMelody(name: string): Promise<void> {
    return this.send(`DELETE:${name}`);
  }

  ping(): Promise<void> {
    return this.send('PING');
  }

  // ---- Dahili yardımcılar ----

  private async openPort(port: SerialPort): Promise<void> {
    let opened = false;
    try {
      await port.open({ baudRate: BAUD_RATE });
      opened = true;
      this.port = port;
      if (!port.readable || !port.writable) {
        throw new Error('Port stream açılamadı');
      }
      // ESP32-S3 native USB CDC, DTR asserted olana dek Serial'i hazır saymıyor → sinyali manuel set et.
      // Bazı sürücülerde setSignals() asılı kalabildiği için timeout'lu yarış koyuyoruz (non-fatal).
      try {
        const setSig = (port as unknown as { setSignals?: (o: { dataTerminalReady?: boolean; requestToSend?: boolean }) => Promise<void> })
          .setSignals?.({ dataTerminalReady: true, requestToSend: true });
        if (setSig) {
          await Promise.race([
            setSig,
            new Promise<void>((_, reject) => setTimeout(() => reject(new Error('setSignals timeout')), 1500)),
          ]);
        }
      } catch { /* non-fatal */ }
      this.writer = port.writable.getWriter();
      this.reader = port.readable.getReader();
      this.emitStatus('connected');
      this.readLoopPromise = this.readLoop();
      // READY tek seferlik yayınlanıyor — bağlantıdan önce kaçırıldıysa PING ile PONG'u hazır sinyali olarak al
      setTimeout(() => { this.ping().catch(() => {}); }, 300);
      setTimeout(() => { this.ping().catch(() => {}); }, 1500);
      setTimeout(() => { this.ping().catch(() => {}); }, 3000);
    } catch (err) {
      // Kısmen açılmış portu temizle ki bir sonraki bağlantı denemesi takılı kalmasın
      try { this.writer?.releaseLock(); } catch { /* ignore */ }
      try { this.reader?.releaseLock(); } catch { /* ignore */ }
      if (opened) {
        try { await port.close(); } catch { /* ignore */ }
      }
      this.port = null;
      this.writer = null;
      this.reader = null;
      throw err;
    }
  }

  private async readLoop(): Promise<void> {
    if (!this.reader) return;
    try {
      while (true) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (!value || value.length === 0) continue;
        this.rxBuffer += TEXT_DECODER.decode(value, { stream: true });
        // '\n' ile satırlara böl
        let nl: number;
        while ((nl = this.rxBuffer.indexOf('\n')) >= 0) {
          const line = this.rxBuffer.slice(0, nl).replace(/\r$/, '');
          this.rxBuffer = this.rxBuffer.slice(nl + 1);
          if (line.length > 0) this.emitMessage(line);
          if (line === 'READY' || line === 'PONG') this.emit({ type: 'ready' });
        }
      }
    } catch (err) {
      if (!this.shuttingDown) {
        const msg = err instanceof Error ? err.message : 'Okuma hatası';
        this.emitStatus('error', msg);
      }
    } finally {
      try { this.reader?.releaseLock(); } catch { /* ignore */ }
      this.reader = null;
    }
  }

  private emit(event: SerialEvent) {
    for (const l of this.listeners) l(event);
  }

  private emitStatus(status: ConnectionStatus, message?: string) {
    this.status = status;
    this.emit({ type: 'status', status, message });
  }

  private emitMessage(line: string) {
    this.emit({ type: 'message', line });
  }
}

// Uygulama genelinde tek bir köprü örneği
export const serialBridge = new SerialBridge();

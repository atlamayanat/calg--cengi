// Web Serial API tip tanımları (TypeScript lib içinde varsayılan olarak yok)
// Kaynak: https://wicg.github.io/serial/

interface SerialPortInfo {
  usbVendorId?: number;
  usbProductId?: number;
}

interface SerialOptions {
  baudRate: number;
  dataBits?: 7 | 8;
  stopBits?: 1 | 2;
  parity?: 'none' | 'even' | 'odd';
  bufferSize?: number;
  flowControl?: 'none' | 'hardware';
}

interface SerialPort extends EventTarget {
  readonly readable: ReadableStream<Uint8Array> | null;
  readonly writable: WritableStream<Uint8Array> | null;
  open(options: SerialOptions): Promise<void>;
  close(): Promise<void>;
  forget?(): Promise<void>;
  getInfo(): SerialPortInfo;
  addEventListener(type: 'connect' | 'disconnect', listener: (this: SerialPort, ev: Event) => void): void;
  removeEventListener(type: 'connect' | 'disconnect', listener: (this: SerialPort, ev: Event) => void): void;
}

interface SerialPortRequestOptions {
  filters?: { usbVendorId?: number; usbProductId?: number }[];
}

interface Serial extends EventTarget {
  getPorts(): Promise<SerialPort[]>;
  requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
  addEventListener(type: 'connect' | 'disconnect', listener: (this: Serial, ev: Event) => void): void;
  removeEventListener(type: 'connect' | 'disconnect', listener: (this: Serial, ev: Event) => void): void;
}

interface Navigator {
  readonly serial: Serial;
}

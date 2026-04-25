// Şifre korumalı ayarlar paneli — sol kenardan kayar
// İçerir: PIN girişi (numpad), ESP32 bağlantısı, BPM kontrolü
// Şifre: 258025  (oturum boyunca hatırlanır)

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock, X, Settings as SettingsIcon, Gauge, PlugZap, Unplug, RefreshCw,
  AlertTriangle, Delete, CheckCircle2, Power,
} from 'lucide-react';
import type { ConnectionStatus } from '../core/serialBridge';

const PASSWORD = '258025';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  // Bağlantı
  status: ConnectionStatus;
  isReady: boolean;
  supported: boolean;
  message?: string;
  onConnect: () => void;
  onDisconnect: () => void;
  onCancelConnect: () => void;
  // BPM
  bpm: number;
  setBpm: (n: number) => void;
}

const STATUS_LABELS: Record<ConnectionStatus, string> = {
  disconnected: 'Bağlı Değil',
  connecting:   'Bağlanıyor…',
  connected:    'Bağlı',
  error:        'Hata',
};

// ---------- Numpad ----------

interface NumpadProps {
  value: string;
  maxLen: number;
  error: boolean;
  onChange: (v: string) => void;
  onSubmit: () => void;
}

function Numpad({ value, maxLen, error, onChange, onSubmit }: NumpadProps) {
  const press = (d: string) => {
    if (value.length < maxLen) onChange(value + d);
  };
  const back = () => onChange(value.slice(0, -1));

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="space-y-4">
      {/* Görsel PIN noktaları */}
      <div className="flex justify-center gap-3 py-4">
        {Array.from({ length: maxLen }).map((_, i) => (
          <motion.div
            key={i}
            animate={error ? { x: [-6, 6, -4, 4, 0] } : {}}
            transition={{ duration: 0.4 }}
            className={`w-5 h-5 rounded-full border-4 transition-all ${
              i < value.length
                ? error ? 'bg-rose-500 border-rose-500' : 'bg-indigo-500 border-indigo-500'
                : 'bg-transparent border-slate-300'
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="text-center text-rose-600 font-black text-sm flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Hatalı şifre
        </p>
      )}

      <div className="grid grid-cols-3 gap-3">
        {keys.map((k) => (
          <NumpadButton key={k} label={k} onPress={() => press(k)} />
        ))}
        <NumpadButton label={<Delete className="w-7 h-7 mx-auto" />} variant="warn" onPress={back} />
        <NumpadButton label="0" onPress={() => press('0')} />
        <NumpadButton label={<CheckCircle2 className="w-7 h-7 mx-auto" />} variant="ok" onPress={onSubmit} />
      </div>
    </div>
  );
}

interface NumpadButtonProps {
  label: React.ReactNode;
  onPress: () => void;
  variant?: 'default' | 'ok' | 'warn';
}

function NumpadButton({ label, onPress, variant = 'default' }: NumpadButtonProps) {
  const styles = {
    default: 'bg-white text-slate-800 shadow-[0_6px_0_rgb(203,213,225)] hover:shadow-[0_3px_0_rgb(203,213,225)] border-white',
    ok:      'bg-emerald-500 text-white shadow-[0_6px_0_rgb(4,120,87)] hover:shadow-[0_3px_0_rgb(4,120,87)] border-emerald-500',
    warn:    'bg-amber-500 text-white shadow-[0_6px_0_rgb(180,83,9)] hover:shadow-[0_3px_0_rgb(180,83,9)] border-amber-500',
  };
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onPress}
      className={`aspect-square w-full rounded-3xl border-4 text-3xl font-black hover:translate-y-1 active:translate-y-2 active:shadow-none transition-all flex items-center justify-center ${styles[variant]}`}
    >
      {label}
    </motion.button>
  );
}

// ---------- Ayarlar içeriği (şifre sonrası) ----------

interface UnlockedProps {
  status: ConnectionStatus;
  isReady: boolean;
  supported: boolean;
  message?: string;
  onConnect: () => void;
  onDisconnect: () => void;
  onCancelConnect: () => void;
  bpm: number;
  setBpm: (n: number) => void;
}

function UnlockedSettings({
  status, isReady, supported, message, onConnect, onDisconnect, onCancelConnect, bpm, setBpm,
}: UnlockedProps) {
  const dotColor =
    status === 'connected' && isReady ? 'bg-emerald-500'
    : status === 'connected'           ? 'bg-amber-400'
    : status === 'connecting'          ? 'bg-amber-400 animate-pulse'
    : status === 'error'               ? 'bg-rose-500'
    : 'bg-slate-400';

  return (
    <div className="space-y-6">
      {/* Bağlantı kartı */}
      <div className="bg-white rounded-3xl border-4 border-white shadow-md p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500 rounded-2xl">
            <PlugZap className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-black text-slate-800">Cihaz Bağlantısı</h3>
        </div>

        <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-2xl">
          <div className={`w-4 h-4 rounded-full ${dotColor} ring-2 ring-white shadow-inner`} />
          <span className="font-black text-slate-800 flex-1">
            {STATUS_LABELS[status]}
            {status === 'connected' && !isReady && ' (hazırlanıyor)'}
          </span>
        </div>

        {message && status === 'error' && (
          <p className="text-sm text-rose-600 font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {message}
          </p>
        )}

        {!supported && (
          <p className="text-sm text-rose-600 font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Tarayıcı USB desteklemiyor (Chrome/Edge gerekli)
          </p>
        )}

        {status === 'connected' ? (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onDisconnect}
            className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-rose-500 text-white font-black text-base shadow-[0_6px_0_rgb(190,18,60)] hover:translate-y-1 hover:shadow-[0_3px_0_rgb(190,18,60)] active:translate-y-2 active:shadow-none transition-all"
          >
            <Unplug className="w-5 h-5" /> BAĞLANTIYI KES
          </motion.button>
        ) : status === 'connecting' ? (
          <div className="space-y-2">
            <div className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-emerald-500 text-white font-black text-base opacity-70">
              <RefreshCw className="w-5 h-5 animate-spin" /> BAĞLANIYOR…
            </div>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={onCancelConnect}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-rose-500 text-white font-black text-sm shadow-[0_6px_0_rgb(190,18,60)] hover:translate-y-1 hover:shadow-[0_3px_0_rgb(190,18,60)] active:translate-y-2 active:shadow-none transition-all"
            >
              <X className="w-4 h-4" /> BAĞLANMAYI İPTAL ET
            </motion.button>
          </div>
        ) : (
          <motion.button
            whileTap={{ scale: 0.96 }}
            disabled={!supported}
            onClick={onConnect}
            className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-emerald-500 text-white font-black text-base shadow-[0_6px_0_rgb(4,120,87)] hover:translate-y-1 hover:shadow-[0_3px_0_rgb(4,120,87)] active:translate-y-2 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlugZap className="w-5 h-5" /> BAĞLAN
          </motion.button>
        )}
      </div>

      {/* BPM kartı */}
      <div className="bg-white rounded-3xl border-4 border-white shadow-md p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500 rounded-2xl">
            <Gauge className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-black text-slate-800">Tempo (BPM)</h3>
        </div>

        <div className="flex items-baseline justify-center gap-2 py-2">
          <span className="text-6xl font-black text-slate-800">{bpm}</span>
          <span className="text-sm font-black text-slate-400 uppercase tracking-widest">bpm</span>
        </div>

        <input
          type="range"
          min={40}
          max={240}
          step={1}
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          className="w-full h-3 accent-indigo-500"
        />

        <div className="grid grid-cols-4 gap-2">
          {[60, 90, 120, 160].map((v) => (
            <button
              key={v}
              onClick={() => setBpm(v)}
              className={`py-3 rounded-2xl font-black text-base transition-all ${
                bpm === v
                  ? 'bg-indigo-500 text-white shadow-[0_4px_0_rgb(49,46,129)]'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-500 text-center">
        İlk bağlantıdan sonra cihaz otomatik tanınır.
      </p>

      {/* Tehlikeli bölge — uygulamayı kapat (sergi/kiosk modu çıkışı) */}
      <div className="bg-rose-50 rounded-3xl border-4 border-rose-200 shadow-md p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500 rounded-2xl">
            <Power className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-black text-rose-700">Uygulamayı Kapat</h3>
        </div>
        <p className="text-xs text-rose-700/80 font-bold">
          Sergi modunu sonlandırır. Yalnızca yetkili personel kullanmalı.
        </p>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            if (typeof window === 'undefined') return;
            // Kiosk: pencereyi kapat; başarısız olursa boş sayfaya yönlendir
            try { window.close(); } catch { /* yok say */ }
            setTimeout(() => { window.location.href = 'about:blank'; }, 200);
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-rose-600 text-white font-black text-base shadow-[0_6px_0_rgb(159,18,57)] hover:translate-y-1 hover:shadow-[0_3px_0_rgb(159,18,57)] active:translate-y-2 active:shadow-none transition-all"
        >
          <Power className="w-5 h-5" /> UYGULAMAYI KAPAT
        </motion.button>
      </div>
    </div>
  );
}

// ---------- Ana panel ----------

export function SettingsPanel(props: SettingsPanelProps) {
  // Kilit durumu kalıcı saklanmaz — panel her kapanıp açıldığında şifre tekrar istenir
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  // Panel her kapatıldığında ve her açıldığında durumu sıfırla
  useEffect(() => {
    if (!props.isOpen) {
      setUnlocked(false);
      setPin('');
      setError(false);
    } else {
      setPin('');
      setError(false);
    }
  }, [props.isOpen]);

  // PIN tam uzunluğa ulaştığında otomatik dene
  useEffect(() => {
    if (pin.length === PASSWORD.length) {
      submitPin(pin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const submitPin = (val: string) => {
    if (val === PASSWORD) {
      setUnlocked(true);
      setPin('');
      setError(false);
    } else {
      setError(true);
      setTimeout(() => setPin(''), 500);
    }
  };

  return (
    <AnimatePresence>
      {props.isOpen && (
        <>
          <motion.div
            key="bd"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            onClick={props.onClose}
          />
          <motion.aside
            key="panel"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="fixed top-4 left-4 bottom-4 w-[min(28rem,calc(100vw-2rem))] bg-white/90 backdrop-blur-md rounded-[2rem] border-4 border-white shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b-4 border-white bg-indigo-50/60">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500 rounded-2xl shadow-[0_4px_0_rgb(49,46,129)]">
                  {unlocked
                    ? <SettingsIcon className="w-5 h-5 text-white" />
                    : <Lock className="w-5 h-5 text-white" />}
                </div>
                <h2 className="text-2xl font-black text-slate-800">
                  {unlocked ? 'Ayarlar' : 'Kilitli'}
                </h2>
              </div>
              <button
                onClick={props.onClose}
                className="p-2 rounded-xl hover:bg-slate-200/60 transition-colors"
                aria-label="Kapat"
              >
                <X className="w-6 h-6 text-slate-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {unlocked ? (
                <UnlockedSettings {...props} />
              ) : (
                <div className="space-y-2">
                  <p className="text-center text-slate-600 font-bold mb-2">
                    Ayarlara erişmek için şifreyi gir
                  </p>
                  <Numpad
                    value={pin}
                    maxLen={PASSWORD.length}
                    error={error}
                    onChange={(v) => { setPin(v); setError(false); }}
                    onSubmit={() => submitPin(pin)}
                  />
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

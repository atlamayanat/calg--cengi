// Kayıtlı melodiler paneli — ESP32 LittleFS üzerinden listeleme/yükleme/silme
// Kaydetme ve silme işlemleri PIN korumalı (258025)

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Save, Trash2, RefreshCw, Music, Library, X, Lock,
  Delete, CheckCircle2, AlertTriangle, Star,
} from 'lucide-react';
import type { Melody } from '../core/melody';
import { getPresetDisplayName } from '../core/presetMelodies';

interface MelodyBrowserProps {
  melodies: string[];          // Preset + yerel + cihaz isimleri (birleşik, sıralı)
  readOnlyNames?: string[];    // Kod içindeki preset'ler — silinemez, kaydetme ile üzerine yazılmaz
  isOpen: boolean;
  isConnected: boolean;
  currentMelody: Melody;       // Aktif olarak çalınan/düzenlenen melodi
  onClose: () => void;
  onRefresh: () => void;
  onLoad: (name: string) => void;
  onSave: (name: string) => void;
  onDelete: (name: string) => void;
}

const NAME_RE = /^[a-z0-9_-]{1,16}$/;
const PASSWORD = '258025';
const UNLOCK_KEY = 'perkusyon_melody_unlocked';

type PendingAction =
  | { type: 'save'; name: string }
  | { type: 'delete'; name: string }
  | null;

export function MelodyBrowser({
  melodies, readOnlyNames, isOpen, isConnected, currentMelody,
  onClose, onRefresh, onLoad, onSave, onDelete,
}: MelodyBrowserProps) {
  const readOnlySet = new Set(readOnlyNames ?? []);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // PIN durumu — oturum boyunca hatırlanır (ayarlar şifresinden bağımsız)
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(UNLOCK_KEY) === 'yes';
  });
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const requireUnlock = (action: PendingAction) => {
    if (unlocked) {
      runAction(action);
    } else {
      setPendingAction(action);
    }
  };

  const runAction = (action: PendingAction) => {
    if (!action) return;
    if (action.type === 'save') {
      onSave(action.name);
      setNewName('');
    } else if (action.type === 'delete') {
      onDelete(action.name);
    }
  };

  const handleSaveClick = () => {
    const name = newName.trim().toLowerCase();
    if (!NAME_RE.test(name)) {
      setError('Sadece küçük harf, rakam, "-" ve "_". Max 16 karakter.');
      return;
    }
    if (readOnlySet.has(name)) {
      setError('Bu isim hazır ritme ait — farklı bir isim seç.');
      return;
    }
    setError(null);
    requireUnlock({ type: 'save', name });
  };

  const handleDeleteClick = (name: string) => {
    requireUnlock({ type: 'delete', name });
  };

  const handlePinSuccess = () => {
    setUnlocked(true);
    sessionStorage.setItem(UNLOCK_KEY, 'yes');
    runAction(pendingAction);
    setPendingAction(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.aside
            key="panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="fixed top-4 right-4 bottom-4 w-[min(28rem,calc(100vw-2rem))] bg-white/90 backdrop-blur-md rounded-[2rem] border-4 border-white shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b-4 border-white bg-indigo-50/60">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500 rounded-2xl shadow-[0_4px_0_rgb(49,46,129)]">
                  <Library className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-black text-slate-800">Melodi Kütüphanesi</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-slate-200/60 transition-colors"
                aria-label="Kapat"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-3 border-b-4 border-white">
              <label className="text-xs uppercase tracking-widest font-black text-slate-500">
                Mevcut deseni kaydet
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="melodi-adi"
                  className="flex-1 px-4 py-3 rounded-2xl border-4 border-white bg-white shadow-inner text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-300 disabled:opacity-50"
                />
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  disabled={!newName.trim()}
                  onClick={handleSaveClick}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-500 text-white font-black text-sm shadow-[0_6px_0_rgb(180,83,9)] hover:translate-y-1 hover:shadow-[0_3px_0_rgb(180,83,9)] active:translate-y-1.5 active:shadow-none transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_6px_0_rgb(180,83,9)]"
                >
                  <Save className="w-4 h-4" /> KAYDET
                </motion.button>
              </div>
              {error && <p className="text-xs text-rose-600 font-bold">{error}</p>}
              <p className="text-xs text-slate-500">
                BPM: <span className="font-black text-slate-700">{currentMelody.bpm}</span> ·
                Slot: <span className="font-black text-slate-700">{currentMelody.slots.filter(Boolean).length}</span>
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-widest font-black text-slate-500">
                  Kayıtlı ({melodies.length}){!isConnected && ' · yerel'}
                </span>
                <button
                  onClick={onRefresh}
                  className="p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors disabled:opacity-40"
                  aria-label="Yenile"
                >
                  <RefreshCw className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              {melodies.length === 0 && (
                <p className="text-sm text-slate-500 italic text-center py-8">
                  Henüz kayıtlı melodi yok.<br />Yukarıdan ilkini kaydet!
                </p>
              )}

              {melodies.map((name) => {
                const isPreset = readOnlySet.has(name);
                const displayName = isPreset ? getPresetDisplayName(name) : name;
                return (
                  <motion.div
                    key={name}
                    layout
                    className={`flex items-center gap-2 p-3 rounded-2xl border-4 shadow-md hover:shadow-lg transition-shadow ${
                      isPreset ? 'bg-amber-50 border-amber-200' : 'bg-white border-white'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${isPreset ? 'bg-amber-200' : 'bg-sky-100'}`}>
                      {isPreset
                        ? <Star className="w-4 h-4 text-amber-700" />
                        : <Music className="w-4 h-4 text-sky-600" />}
                    </div>
                    <span className="flex-1 font-black text-slate-800 truncate">{displayName}</span>
                    {isPreset && (
                      <span className="text-[10px] uppercase tracking-widest font-black text-amber-700 bg-amber-100 border-2 border-amber-200 rounded-lg px-2 py-0.5">
                        Hazır
                      </span>
                    )}
                    <button
                      onClick={() => onLoad(name)}
                      className="px-3 py-1.5 rounded-xl bg-sky-500 text-white text-xs font-black shadow-[0_3px_0_rgb(3,105,161)] hover:translate-y-0.5 hover:shadow-[0_2px_0_rgb(3,105,161)] transition-all"
                    >
                      YÜKLE
                    </button>
                    {!isPreset && (
                      <button
                        onClick={() => handleDeleteClick(name)}
                        className="p-2 rounded-xl bg-rose-500 text-white shadow-[0_3px_0_rgb(190,18,60)] hover:translate-y-0.5 hover:shadow-[0_2px_0_rgb(190,18,60)] transition-all"
                        aria-label={`${name} sil`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.aside>

          {pendingAction && (
            <PinPrompt
              title={pendingAction.type === 'save' ? 'Kaydetmek için şifre' : 'Silmek için şifre'}
              onCancel={() => setPendingAction(null)}
              onSuccess={handlePinSuccess}
            />
          )}
        </>
      )}
    </AnimatePresence>
  );
}

// ---------- Şifre modali ----------

interface PinPromptProps {
  title: string;
  onCancel: () => void;
  onSuccess: () => void;
}

function PinPrompt({ title, onCancel, onSuccess }: PinPromptProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const submit = (val: string) => {
    if (val === PASSWORD) {
      onSuccess();
    } else {
      setError(true);
      setTimeout(() => setPin(''), 500);
    }
  };

  // PIN tam uzunluğa ulaştığında otomatik dene
  useEffect(() => {
    if (pin.length === PASSWORD.length) submit(pin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const press = (d: string) => {
    if (pin.length < PASSWORD.length) setPin(pin + d);
    setError(false);
  };
  const back = () => { setPin(pin.slice(0, -1)); setError(false); };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-[min(22rem,100%)] bg-white rounded-[2rem] border-4 border-white shadow-2xl p-6 space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500 rounded-2xl">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-black text-slate-800 flex-1">{title}</h3>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-xl hover:bg-slate-200/60 transition-colors"
            aria-label="Kapat"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="flex justify-center gap-2 py-2">
          {Array.from({ length: PASSWORD.length }).map((_, i) => (
            <motion.div
              key={i}
              animate={error ? { x: [-6, 6, -4, 4, 0] } : {}}
              transition={{ duration: 0.4 }}
              className={`w-4 h-4 rounded-full border-4 transition-all ${
                i < pin.length
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

        <div className="grid grid-cols-3 gap-2">
          {keys.map((k) => (
            <button
              key={k}
              onClick={() => press(k)}
              className="aspect-square rounded-2xl bg-white text-slate-800 border-4 border-white text-2xl font-black shadow-[0_4px_0_rgb(203,213,225)] hover:translate-y-0.5 hover:shadow-[0_2px_0_rgb(203,213,225)] active:translate-y-1 active:shadow-none transition-all"
            >
              {k}
            </button>
          ))}
          <button
            onClick={back}
            className="aspect-square rounded-2xl bg-amber-500 text-white border-4 border-amber-500 font-black shadow-[0_4px_0_rgb(180,83,9)] hover:translate-y-0.5 hover:shadow-[0_2px_0_rgb(180,83,9)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center"
          >
            <Delete className="w-6 h-6" />
          </button>
          <button
            onClick={() => press('0')}
            className="aspect-square rounded-2xl bg-white text-slate-800 border-4 border-white text-2xl font-black shadow-[0_4px_0_rgb(203,213,225)] hover:translate-y-0.5 hover:shadow-[0_2px_0_rgb(203,213,225)] active:translate-y-1 active:shadow-none transition-all"
          >
            0
          </button>
          <button
            onClick={() => submit(pin)}
            className="aspect-square rounded-2xl bg-emerald-500 text-white border-4 border-emerald-500 font-black shadow-[0_4px_0_rgb(4,120,87)] hover:translate-y-0.5 hover:shadow-[0_2px_0_rgb(4,120,87)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center"
          >
            <CheckCircle2 className="w-6 h-6" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

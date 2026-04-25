// Tek bir ritim dizisinin (slot tabanlı) veri modeli
// 9 slot × {enstrüman, vuruş, bekleme süresi}

import type { InstrumentId } from './instruments';

export interface RhythmSlot {
  instrument: InstrumentId;
  hits: number;       // Vurma sayısı (WAIT için 0)
  duration?: number;  // Bekleme süresi (ms) — sadece WAIT için
}

export interface Melody {
  name: string;
  bpm: number;
  slots: (RhythmSlot | null)[];
}

export const MAX_SLOTS = 9;

export function emptySlots(): (RhythmSlot | null)[] {
  return new Array(MAX_SLOTS).fill(null);
}

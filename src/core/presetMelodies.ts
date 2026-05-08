// Uygulama ile birlikte gelen hazır ritimler — kütüphanede silinemez/yazılamaz şekilde görünür.
// Donanım enstrümanları: BD1 (Büyük Davul), BZ1 (Zil), DR1 (Darbuka), BAT (Bateri Davulu),
// MIN (Mini Davul), KSI (Ksilafon) + WAIT.
// Her slot: { instrument, hits (1-4) } veya { instrument: 'WAIT', hits: 0, duration: 500/1000/1500/2000 }.
// MAX_SLOTS = 9.

import { MAX_SLOTS, type Melody, type RhythmSlot } from './melody';

function pad(slots: RhythmSlot[]): (RhythmSlot | null)[] {
  const out: (RhythmSlot | null)[] = slots.slice(0, MAX_SLOTS);
  while (out.length < MAX_SLOTS) out.push(null);
  return out;
}

export const PRESET_MELODIES: Record<string, Melody> = {
  // 1) Yürüyüş — büyük davul, bateri ve zil dönüşümlü, düzenli yürüyüş ritmi
  'yuruyus': {
    name: 'Yürüyüş',
    bpm: 110,
    slots: pad([
      { instrument: 'BD1', hits: 1 },
      { instrument: 'BZ1', hits: 1 },
      { instrument: 'BAT', hits: 1 },
      { instrument: 'BZ1', hits: 1 },
      { instrument: 'BD1', hits: 1 },
      { instrument: 'BZ1', hits: 1 },
      { instrument: 'BAT', hits: 1 },
      { instrument: 'BZ1', hits: 1 },
    ]),
  },

  // 2) Rock — bateri davulu odaklı backbeat, mini davul ve zil aksanlı
  'rock': {
    name: 'rock',
    bpm: 130,
    slots: pad([
      { instrument: 'BAT', hits: 2 },
      { instrument: 'BZ1', hits: 2 },
      { instrument: 'MIN', hits: 2 },
      { instrument: 'BZ1', hits: 2 },
      { instrument: 'BAT', hits: 2 },
      { instrument: 'BZ1', hits: 2 },
      { instrument: 'MIN', hits: 2 },
      { instrument: 'BZ1', hits: 2 },
    ]),
  },

  // 3) Darbuka — düm-tek temelli, aralarda ksilafon süsleme
  'darbuka': {
    name: 'darbuka',
    bpm: 115,
    slots: pad([
      { instrument: 'DR1', hits: 1 },
      { instrument: 'DR1', hits: 2 },
      { instrument: 'KSI', hits: 1 },
      { instrument: 'DR1', hits: 1 },
      { instrument: 'DR1', hits: 2 },
      { instrument: 'KSI', hits: 2 },
      { instrument: 'DR1', hits: 1 },
      { instrument: 'DR1', hits: 2 },
      { instrument: 'KSI', hits: 1 },
    ]),
  },

  // 4) Mehter — Türk askeri yürüyüşü, büyük davul + zil vurgulu
  'mehter': {
    name: 'Marş',
    bpm: 100,
    slots: pad([
      { instrument: 'BD1', hits: 2 },
      { instrument: 'BD1', hits: 1 },
      { instrument: 'BZ1', hits: 2 },
      { instrument: 'BD1', hits: 2 },
      { instrument: 'BD1', hits: 1 },
      { instrument: 'BZ1', hits: 2 },
      { instrument: 'BD1', hits: 2 },
    ]),
  },

  // 5) Hareketli — hızlı ve enerjik, tüm enstrümanlardan renkli vuruşlar
  'hareketli': {
    name: 'Hareketli',
    bpm: 145,
    slots: pad([
      { instrument: 'MIN', hits: 3 },
      { instrument: 'BAT', hits: 2 },
      { instrument: 'KSI', hits: 3 },
      { instrument: 'BZ1', hits: 2 },
      { instrument: 'DR1', hits: 3 },
      { instrument: 'KSI', hits: 2 },
      { instrument: 'BD1', hits: 2 },
      { instrument: 'BZ1', hits: 3 },
    ]),
  },

  // 6) Caz — mini davul + zil swing, ksilafon melodi çizgisi
  'caz': {
    name: 'Caz',
    bpm: 135,
    slots: pad([
      { instrument: 'MIN', hits: 1 },
      { instrument: 'BZ1', hits: 2 },
      { instrument: 'KSI', hits: 1 },
      { instrument: 'MIN', hits: 1 },
      { instrument: 'BZ1', hits: 1 },
      { instrument: 'KSI', hits: 2 },
      { instrument: 'BAT', hits: 1 },
      { instrument: 'BZ1', hits: 2 },
    ]),
  },

  // 7) Yavaş — beklemeli, sakin ksilafon ve davul tınısı
  'yavas': {
    name: 'Yavaş',
    bpm: 70,
    slots: pad([
      { instrument: 'KSI', hits: 1 },
      { instrument: 'WAIT', hits: 0, duration: 1000 },
      { instrument: 'BD1', hits: 1 },
      { instrument: 'WAIT', hits: 0, duration: 1000 },
      { instrument: 'KSI', hits: 2 },
      { instrument: 'WAIT', hits: 0, duration: 1500 },
      { instrument: 'BAT', hits: 2 },
    ]),
  },

  // 8) Kopus — yoğun vuruş + ani bekleme ile patlama finali
  'kopus': {
    name: 'Kopuş',
    bpm: 120,
    slots: pad([
      { instrument: 'BD1', hits: 4 },
      { instrument: 'BAT', hits: 4 },
      { instrument: 'WAIT', hits: 0, duration: 500 },
      { instrument: 'DR1', hits: 3 },
      { instrument: 'MIN', hits: 3 },
      { instrument: 'KSI', hits: 4 },
      { instrument: 'BZ1', hits: 3 },
    ]),
  },

  // 9) Ksilafon — melodik ksilafon temaları üzerine davul desteği
  'ksilafon': {
    name: 'Ksilafon',
    bpm: 125,
    slots: pad([
      { instrument: 'KSI', hits: 3 },
      { instrument: 'BD1', hits: 1 },
      { instrument: 'KSI', hits: 2 },
      { instrument: 'BAT', hits: 1 },
      { instrument: 'KSI', hits: 4 },
      { instrument: 'MIN', hits: 2 },
      { instrument: 'KSI', hits: 3 },
      { instrument: 'BZ1', hits: 2 },
    ]),
  },

  // 10) Bateri — drum kit backbeat, mini davul ve zil ile
  'bateri': {
    name: 'Bateri',
    bpm: 140,
    slots: pad([
      { instrument: 'BAT', hits: 2 },
      { instrument: 'MIN', hits: 1 },
      { instrument: 'BAT', hits: 2 },
      { instrument: 'BZ1', hits: 2 },
      { instrument: 'BAT', hits: 3 },
      { instrument: 'MIN', hits: 2 },
      { instrument: 'BAT', hits: 2 },
      { instrument: 'BZ1', hits: 3 },
    ]),
  },
};

export const PRESET_NAMES: string[] = Object.keys(PRESET_MELODIES);

export const PRESET_DISPLAY_NAMES: Record<string, string> = {
  yuruyus: 'Yürüyüş',
  rock: 'Rock',
  darbuka: 'Darbuka',
  mehter: 'Marş',
  hareketli: 'Hareketli',
  caz: 'Caz',
  yavas: 'Yavaş',
  kopus: 'Kopuş',
  ksilafon: 'Ksilafon',
  bateri: 'Bateri',
};

export function getPresetDisplayName(name: string): string {
  return PRESET_DISPLAY_NAMES[name] ?? name;
}

export function isPresetName(name: string): boolean {
  return name in PRESET_MELODIES;
}

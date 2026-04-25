// 7 enstrüman kartı: 6 donanım kanalı + Bekle (yazılım-içi)
// Renkler mevcut tasarım dilinden (App.tsx) miras alındı

import { Clock, type LucideIcon } from 'lucide-react';

export type InstrumentId =
  | 'BD1'
  | 'BZ1'
  | 'DR1'
  | 'BAT'
  | 'MIN'
  | 'KSI'
  | 'WAIT';

export interface Instrument {
  id: InstrumentId;
  name: string;
  // PNG yolu (public/instruments altından servis edilir) ya da lucide bileşeni (WAIT için)
  icon: string | LucideIcon;
  color: string;       // Tailwind bg-* (kart yüzeyi)
  // Donanım kanalları — birden fazla solenoid paralel bağlıysa sıra ile tetiklenir
  // (ör. 2 zil → 4 vuruşta zil1/zil2/zil1/zil2). Boş dizi = donanımsız (WAIT).
  channels: number[];
  soundFreq: number;   // Tarayıcıda ön-izleme tonu (donanım yokken)
}

// Fiziksel sistem: 2 büyük davul + 2 zil + 1 darbuka + 1 bateri davulu + 1 mini davul + 1 ksilafon = 8 solenoid.
// Arayüzde 6 donanım enstrümanı + Bekle gözükür; çiftli olanlarda (büyük davul, zil) vuruşlar
// iki kanal arasında dönüşümlü tetiklenir → her solenoidin geri dönme süresi ikiye katlanır.
// Kanal sırası → firmware CHANNEL_PINS dizisi (H1=0..H8=7).
export const INSTRUMENTS: Instrument[] = [
  { id: 'BD1',  name: 'Büyük Davul',   icon: '/instruments/buyukdavul.png', color: 'bg-emerald-500', channels: [0, 1], soundFreq: 110 }, // H1+H2 (GPIO20, 21)
  { id: 'BZ1',  name: 'Zil',           icon: '/instruments/zil.png',        color: 'bg-rose-500',    channels: [2, 3], soundFreq: 820 }, // H3+H4 (GPIO47, 48)
  { id: 'DR1',  name: 'Darbuka',       icon: '/instruments/darbuka.png',    color: 'bg-sky-500',     channels: [4],    soundFreq: 200 }, // H5    (GPIO45)
  { id: 'BAT',  name: 'Bateri Davulu', icon: '/instruments/bateri.png',     color: 'bg-orange-500',  channels: [5],    soundFreq: 150 }, // H6    (GPIO38)
  { id: 'MIN',  name: 'Mini Davul',    icon: '/instruments/minidavul.png',  color: 'bg-amber-500',   channels: [6],    soundFreq: 320 }, // H7    (GPIO39)
  { id: 'KSI',  name: 'Ksilafon',      icon: '/instruments/ksilafon.png',   color: 'bg-fuchsia-500', channels: [7],    soundFreq: 600 }, // H8    (GPIO40)
  { id: 'WAIT', name: 'Bekle',         icon: Clock,                         color: 'bg-purple-500',  channels: [],     soundFreq: 0 },
];

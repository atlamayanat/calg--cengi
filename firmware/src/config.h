// Sistem genelinde kullanılan sabitler ve donanım tanımları
#pragma once

#include <Arduino.h>

// Toplam solenoid kanal sayısı (H1..H8 — 2 adet ULN2803A sürücüsü üzerinden)
constexpr uint8_t CHANNEL_COUNT = 8;

// Devre şemasından alınmış GPIO eşleşmesi (kanal sırasıyla H1..H8)
// Q1 ULN2803A → H1..H4, Q2 ULN2803A → H5..H8
// UI tarafı çiftli enstrümanları iki kanal arasında dönüşümlü tetikler (solenoid dinlensin).
constexpr uint8_t CHANNEL_PINS[CHANNEL_COUNT] = {
    20, // 0 - H1  (Q1 1IN)  Büyük Davul 1
    21, // 1 - H2  (Q1 2IN)  Büyük Davul 2
    47, // 2 - H3  (Q1 3IN)  Zil 1
    48, // 3 - H4  (Q1 4IN)  Zil 2
    45, // 4 - H5  (Q2 1IN)  Darbuka
    38, // 5 - H6  (Q2 3IN)  Bateri Davulu
    39, // 6 - H7  (Q2 6IN)  Mini Davul
    40  // 7 - H8  (Q2 7IN)  Ksilafon
};

// Solenoid darbe süresi sınırları (ms) — bobin koruması
constexpr uint16_t PULSE_MIN_MS = 5;
constexpr uint16_t PULSE_MAX_MS = 300;
constexpr uint16_t PULSE_DEFAULT_MS = 250;

// Sekans motoru sınırları
constexpr uint16_t SEQ_BPM_MIN = 40;
constexpr uint16_t SEQ_BPM_MAX = 240;
constexpr uint16_t SEQ_STEPS_MAX = 64;

// Melodi dosyası yolları (LittleFS)
constexpr const char* MELODY_DIR = "/melodies";
constexpr uint8_t MELODY_NAME_MAX = 16;

// Seri arabellek
constexpr uint16_t SERIAL_BUFFER_SIZE = 1024;

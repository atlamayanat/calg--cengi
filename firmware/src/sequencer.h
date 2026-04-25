// Adım sekansı motoru — non-blocking, millis() tabanlı 16th-note zamanlayıcı
#pragma once

#include <Arduino.h>
#include "config.h"

namespace Sequencer {

// Sekans deseni: her kanal için bit-pack edilmiş adım maskesi (max 64 adım = uint64_t)
struct Pattern {
    uint16_t bpm;
    uint8_t  stepCount;                 // 1..SEQ_STEPS_MAX
    uint64_t channelSteps[CHANNEL_COUNT]; // bit i = 1 ise o kanal i. adımda vurur
};

// Sekansör başlangıç durumuna alınır
void begin();

// Yeni desen yükler (ama otomatik çalmaya başlamaz)
void load(const Pattern& pattern);

// Yüklü deseni 0. adımdan başlatır
void play();

// Çalmayı durdurur
void stop();

// Şu an çalıyor mu?
bool isPlaying();

// Mevcut adım indeksi (çalmıyorsa anlamsız)
uint8_t currentStep();

// Her loop()'ta çağrılır — beat zamanı geldiyse vurmaları tetikler
void update();

// Mevcut yüklü deseni döner (kaydetme için)
const Pattern& getPattern();

}  // namespace Sequencer

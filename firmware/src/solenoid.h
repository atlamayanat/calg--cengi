// Non-blocking solenoid sürücüsü — millis() tabanlı zamanlayıcılar
#pragma once

#include <Arduino.h>
#include "config.h"

namespace Solenoid {

// GPIO'ları çıkış olarak ayarlar ve LOW yapar
void begin();

// Belirtilen kanalı varsayılan darbe süresiyle tetikler
void hit(uint8_t channel);

// Belirtilen kanalı özel süreyle tetikler (PULSE_MIN..PULSE_MAX arasında sınırlanır)
void hit(uint8_t channel, uint16_t pulseMs);

// Bir kanalın varsayılan darbe süresini değiştirir (kalıcı değil — RAM'de)
void setDefaultPulse(uint8_t channel, uint16_t pulseMs);

// Bir kanalın mevcut varsayılan darbe süresini döner
uint16_t getDefaultPulse(uint8_t channel);

// Aktif darbeleri kontrol eder, süresi dolanları LOW yapar — her loop()'ta çağrılmalı
void update();

// Tüm kanalları acil olarak LOW yapar (acil dur)
void allOff();

}  // namespace Solenoid

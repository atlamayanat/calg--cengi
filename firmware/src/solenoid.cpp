#include "solenoid.h"

namespace Solenoid {

// Her kanalın bağımsız zamanlayıcı durumu
struct ChannelState {
    uint32_t endTimeMs;       // Darbe bitiş zamanı (0 = boşta)
    uint16_t defaultPulseMs;  // Bu kanal için varsayılan darbe süresi
};

static ChannelState states[CHANNEL_COUNT];

void begin() {
    for (uint8_t i = 0; i < CHANNEL_COUNT; ++i) {
        pinMode(CHANNEL_PINS[i], OUTPUT);
        digitalWrite(CHANNEL_PINS[i], LOW);
        states[i].endTimeMs = 0;
        states[i].defaultPulseMs = PULSE_DEFAULT_MS;
    }
}

void hit(uint8_t channel) {
    if (channel >= CHANNEL_COUNT) return;
    hit(channel, states[channel].defaultPulseMs);
}

void hit(uint8_t channel, uint16_t pulseMs) {
    if (channel >= CHANNEL_COUNT) return;
    if (pulseMs < PULSE_MIN_MS) pulseMs = PULSE_MIN_MS;
    if (pulseMs > PULSE_MAX_MS) pulseMs = PULSE_MAX_MS;

    digitalWrite(CHANNEL_PINS[channel], HIGH);
    // Aktifken yeni darbe gelirse zamanlayıcı sıfırlanır (re-trigger davranışı)
    states[channel].endTimeMs = millis() + pulseMs;
}

void setDefaultPulse(uint8_t channel, uint16_t pulseMs) {
    if (channel >= CHANNEL_COUNT) return;
    if (pulseMs < PULSE_MIN_MS) pulseMs = PULSE_MIN_MS;
    if (pulseMs > PULSE_MAX_MS) pulseMs = PULSE_MAX_MS;
    states[channel].defaultPulseMs = pulseMs;
}

uint16_t getDefaultPulse(uint8_t channel) {
    if (channel >= CHANNEL_COUNT) return 0;
    return states[channel].defaultPulseMs;
}

void update() {
    const uint32_t now = millis();
    for (uint8_t i = 0; i < CHANNEL_COUNT; ++i) {
        if (states[i].endTimeMs != 0 && (int32_t)(now - states[i].endTimeMs) >= 0) {
            digitalWrite(CHANNEL_PINS[i], LOW);
            states[i].endTimeMs = 0;
        }
    }
}

void allOff() {
    for (uint8_t i = 0; i < CHANNEL_COUNT; ++i) {
        digitalWrite(CHANNEL_PINS[i], LOW);
        states[i].endTimeMs = 0;
    }
}

}  // namespace Solenoid

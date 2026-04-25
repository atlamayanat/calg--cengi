// Perküsyon Otomasyon Sistemi - ESP32-S3 ana giriş noktası
// Tüm alt sistemleri başlatır ve loop()'ta non-blocking olarak günceller

#include <Arduino.h>
#include "config.h"
#include "solenoid.h"
#include "sequencer.h"
#include "storage.h"
#include "serial_parser.h"

void setup() {
    Serial.begin(115200);
    // USB CDC için kısa bir hazırlık beklemesi (yalnızca başlangıçta, ana döngüde yok)
    uint32_t t0 = millis();
    while (!Serial && (millis() - t0) < 1500) { /* USB enumeration */ }

    Solenoid::begin();
    Sequencer::begin();
    SerialParser::begin();

    if (!Storage::begin()) {
        Serial.println("ERR:FS_MOUNT");
    }

    Serial.println("READY");
}

void loop() {
    SerialParser::update();
    Sequencer::update();
    Solenoid::update();
}

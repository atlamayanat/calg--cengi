#include "serial_parser.h"
#include "config.h"
#include "solenoid.h"
#include "sequencer.h"
#include "storage.h"

namespace SerialParser {

static char    buf[SERIAL_BUFFER_SIZE];
static size_t  bufLen = 0;

static void sendErr(const char* msg) {
    Serial.print("ERR:");
    Serial.println(msg);
}

// "1010110100..." şeklindeki binary string'i bit-pack uint64'e çevirir
static uint64_t parseStepMask(const char* s, uint8_t expectedSteps) {
    uint64_t mask = 0;
    for (uint8_t i = 0; i < expectedSteps && s[i] != '\0'; ++i) {
        if (s[i] == '1') mask |= ((uint64_t)1 << i);
    }
    return mask;
}

// Komutu ':' ile parçalara böler, parts[] dizisine doldurur, parça sayısını döner
static uint8_t splitColons(char* line, char* parts[], uint8_t maxParts) {
    uint8_t count = 0;
    parts[count++] = line;
    for (char* p = line; *p && count < maxParts; ++p) {
        if (*p == ':') {
            *p = '\0';
            parts[count++] = p + 1;
        }
    }
    return count;
}

static void handlePing() {
    Serial.println("PONG");
}

static void handleHit(char* parts[], uint8_t n) {
    if (n < 2) { sendErr("HIT_ARGS"); return; }
    int ch = atoi(parts[1]);
    if (ch < 0 || ch >= CHANNEL_COUNT) { sendErr("HIT_CH"); return; }
    if (n >= 3) {
        int ms = atoi(parts[2]);
        Solenoid::hit((uint8_t)ch, (uint16_t)ms);
    } else {
        Solenoid::hit((uint8_t)ch);
    }
    Serial.println("OK");
}

static void handleSeq(char* parts[], uint8_t n) {
    // SEQ:bpm:steps:ch0:ch1:ch2:ch3:ch4:ch5:ch6
    if (n < 3 + CHANNEL_COUNT) { sendErr("SEQ_ARGS"); return; }
    Sequencer::Pattern p;
    p.bpm = (uint16_t)atoi(parts[1]);
    p.stepCount = (uint8_t)atoi(parts[2]);
    if (p.stepCount == 0 || p.stepCount > SEQ_STEPS_MAX) { sendErr("SEQ_STEPS"); return; }
    for (uint8_t i = 0; i < CHANNEL_COUNT; ++i) {
        p.channelSteps[i] = parseStepMask(parts[3 + i], p.stepCount);
    }
    Sequencer::load(p);
    Sequencer::play();
    Serial.println("PLAYING");
}

static void handleStop() {
    Sequencer::stop();
    Solenoid::allOff();
    Serial.println("STOPPED");
}

static void handleSetPulse(char* parts[], uint8_t n) {
    if (n < 3) { sendErr("PULSE_ARGS"); return; }
    int ch = atoi(parts[1]);
    int ms = atoi(parts[2]);
    if (ch < 0 || ch >= CHANNEL_COUNT) { sendErr("PULSE_CH"); return; }
    Solenoid::setDefaultPulse((uint8_t)ch, (uint16_t)ms);
    Serial.println("OK");
}

static void handleSave(char* parts[], uint8_t n) {
    if (n < 2) { sendErr("SAVE_NAME"); return; }
    if (!Storage::isValidName(parts[1])) { sendErr("SAVE_NAME"); return; }
    if (!Storage::save(parts[1], Sequencer::getPattern())) { sendErr("SAVE_FAIL"); return; }
    Serial.print("SAVED:");
    Serial.println(parts[1]);
}

static void handleLoad(char* parts[], uint8_t n) {
    if (n < 2) { sendErr("LOAD_NAME"); return; }
    Sequencer::Pattern p;
    if (!Storage::load(parts[1], p)) { sendErr("LOAD_FAIL"); return; }
    Sequencer::load(p);
    Sequencer::play();
    Serial.println("PLAYING");
}

static void handleList() {
    String out;
    Storage::list(out);
    Serial.print("LIST:");
    Serial.println(out);
}

static void handleDelete(char* parts[], uint8_t n) {
    if (n < 2) { sendErr("DEL_NAME"); return; }
    if (!Storage::remove(parts[1])) { sendErr("DEL_FAIL"); return; }
    Serial.print("DELETED:");
    Serial.println(parts[1]);
}

static void dispatch(char* line) {
    if (line[0] == '\0') return;

    char* parts[3 + CHANNEL_COUNT + 2];
    uint8_t n = splitColons(line, parts, sizeof(parts) / sizeof(parts[0]));
    const char* cmd = parts[0];

    if      (strcmp(cmd, "PING")     == 0) handlePing();
    else if (strcmp(cmd, "HIT")      == 0) handleHit(parts, n);
    else if (strcmp(cmd, "SEQ")      == 0) handleSeq(parts, n);
    else if (strcmp(cmd, "STOP")     == 0) handleStop();
    else if (strcmp(cmd, "SETPULSE") == 0) handleSetPulse(parts, n);
    else if (strcmp(cmd, "SAVE")     == 0) handleSave(parts, n);
    else if (strcmp(cmd, "LOAD")     == 0) handleLoad(parts, n);
    else if (strcmp(cmd, "LIST")     == 0) handleList();
    else if (strcmp(cmd, "DELETE")   == 0) handleDelete(parts, n);
    else                                    sendErr("UNKNOWN_CMD");
}

void begin() {
    bufLen = 0;
}

void update() {
    while (Serial.available() > 0) {
        int c = Serial.read();
        if (c < 0) break;
        if (c == '\r') continue;
        if (c == '\n') {
            buf[bufLen] = '\0';
            dispatch(buf);
            bufLen = 0;
            continue;
        }
        if (bufLen < SERIAL_BUFFER_SIZE - 1) {
            buf[bufLen++] = (char)c;
        } else {
            // Buffer dolu → satırı boz, hata gönder, sıfırla
            bufLen = 0;
            sendErr("OVERFLOW");
        }
    }
}

}  // namespace SerialParser

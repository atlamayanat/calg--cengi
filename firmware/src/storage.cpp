#include "storage.h"
#include <LittleFS.h>
#include <ArduinoJson.h>

namespace Storage {

static char pathBuf[64];

static const char* buildPath(const char* name) {
    snprintf(pathBuf, sizeof(pathBuf), "%s/%s.json", MELODY_DIR, name);
    return pathBuf;
}

bool begin() {
    if (!LittleFS.begin(true)) return false;
    if (!LittleFS.exists(MELODY_DIR)) LittleFS.mkdir(MELODY_DIR);
    return true;
}

bool isValidName(const char* name) {
    if (!name || !*name) return false;
    size_t len = strlen(name);
    if (len > MELODY_NAME_MAX) return false;
    for (size_t i = 0; i < len; ++i) {
        char c = name[i];
        bool ok = (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c == '-' || c == '_';
        if (!ok) return false;
    }
    return true;
}

bool save(const char* name, const Sequencer::Pattern& pattern) {
    if (!isValidName(name)) return false;

    JsonDocument doc;
    doc["bpm"] = pattern.bpm;
    doc["steps"] = pattern.stepCount;
    JsonArray ch = doc["ch"].to<JsonArray>();
    for (uint8_t i = 0; i < CHANNEL_COUNT; ++i) {
        // 64-bit değerleri JSON sayı sınırı aşmasın diye string olarak yazılır
        char buf[24];
        snprintf(buf, sizeof(buf), "%llu", (unsigned long long)pattern.channelSteps[i]);
        ch.add(buf);
    }

    File f = LittleFS.open(buildPath(name), "w");
    if (!f) return false;
    bool ok = serializeJson(doc, f) > 0;
    f.close();
    return ok;
}

bool load(const char* name, Sequencer::Pattern& out) {
    if (!isValidName(name)) return false;
    File f = LittleFS.open(buildPath(name), "r");
    if (!f) return false;

    JsonDocument doc;
    DeserializationError err = deserializeJson(doc, f);
    f.close();
    if (err) return false;

    out.bpm = doc["bpm"] | 120;
    out.stepCount = doc["steps"] | 16;
    JsonArray ch = doc["ch"].as<JsonArray>();
    for (uint8_t i = 0; i < CHANNEL_COUNT; ++i) {
        const char* s = (i < ch.size()) ? ch[i].as<const char*>() : "0";
        out.channelSteps[i] = s ? strtoull(s, nullptr, 10) : 0;
    }
    return true;
}

bool remove(const char* name) {
    if (!isValidName(name)) return false;
    return LittleFS.remove(buildPath(name));
}

void list(String& out) {
    out = "";
    File dir = LittleFS.open(MELODY_DIR);
    if (!dir || !dir.isDirectory()) return;

    File entry = dir.openNextFile();
    bool first = true;
    while (entry) {
        String name = entry.name();
        // dosya adı formatı: "...name.json" — uzantıyı çıkar
        int dot = name.lastIndexOf('.');
        if (dot > 0) name = name.substring(0, dot);
        // klasör prefix'i bazı sürümlerde gelir, son '/' sonrasını al
        int slash = name.lastIndexOf('/');
        if (slash >= 0) name = name.substring(slash + 1);

        if (!first) out += ",";
        out += name;
        first = false;
        entry = dir.openNextFile();
    }
}

}  // namespace Storage

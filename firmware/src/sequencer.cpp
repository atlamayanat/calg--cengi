#include "sequencer.h"
#include "solenoid.h"

namespace Sequencer {

static Pattern  g_pattern;
static bool     g_playing = false;
static uint8_t  g_step = 0;
static uint32_t g_nextBeatMs = 0;
static uint32_t g_beatIntervalMs = 125;  // 120 BPM 16th = 125ms

// 16th-note aralığını ms cinsinden hesaplar: (60000 / BPM) / 4
static uint32_t calcBeatIntervalMs(uint16_t bpm) {
    if (bpm < SEQ_BPM_MIN) bpm = SEQ_BPM_MIN;
    if (bpm > SEQ_BPM_MAX) bpm = SEQ_BPM_MAX;
    return (60000UL / bpm) / 4UL;
}

void begin() {
    g_pattern.bpm = 120;
    g_pattern.stepCount = 16;
    for (uint8_t i = 0; i < CHANNEL_COUNT; ++i) g_pattern.channelSteps[i] = 0;
    g_playing = false;
    g_step = 0;
}

void load(const Pattern& pattern) {
    g_pattern = pattern;
    if (g_pattern.stepCount == 0) g_pattern.stepCount = 1;
    if (g_pattern.stepCount > SEQ_STEPS_MAX) g_pattern.stepCount = SEQ_STEPS_MAX;
    g_beatIntervalMs = calcBeatIntervalMs(g_pattern.bpm);
}

void play() {
    g_step = 0;
    g_beatIntervalMs = calcBeatIntervalMs(g_pattern.bpm);
    g_nextBeatMs = millis();  // İlk beat hemen tetiklensin
    g_playing = true;
}

void stop() {
    g_playing = false;
}

bool isPlaying() { return g_playing; }
uint8_t currentStep() { return g_step; }
const Pattern& getPattern() { return g_pattern; }

void update() {
    if (!g_playing) return;
    const uint32_t now = millis();
    if ((int32_t)(now - g_nextBeatMs) < 0) return;

    // Bu adımda 1 olan tüm kanalları tetikle
    for (uint8_t ch = 0; ch < CHANNEL_COUNT; ++ch) {
        if (g_pattern.channelSteps[ch] & ((uint64_t)1 << g_step)) {
            Solenoid::hit(ch);
        }
    }

    g_step = (g_step + 1) % g_pattern.stepCount;
    g_nextBeatMs += g_beatIntervalMs;
}

}  // namespace Sequencer

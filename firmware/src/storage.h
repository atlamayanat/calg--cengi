// LittleFS üzerinde melodi kalıcı depolama (JSON formatı)
#pragma once

#include <Arduino.h>
#include "sequencer.h"

namespace Storage {

// LittleFS'i mount eder ve melodi klasörünü oluşturur. false dönerse mount başarısız.
bool begin();

// Melodi adının geçerli olup olmadığını doğrular (a-z, 0-9, '-', '_', max 16 char)
bool isValidName(const char* name);

// Mevcut deseni belirtilen isimle JSON olarak kaydeder
bool save(const char* name, const Sequencer::Pattern& pattern);

// Belirtilen ismi yükler ve out parametresine doldurur
bool load(const char* name, Sequencer::Pattern& out);

// Belirtilen melodiyi siler
bool remove(const char* name);

// Kayıtlı melodi isimlerini virgülle birleştirip out'a yazar (max 512 char)
void list(String& out);

}  // namespace Storage

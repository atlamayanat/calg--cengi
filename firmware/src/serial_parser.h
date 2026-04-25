// Seri komut parser — '\n' ile sonlanan ASCII satırları işler
#pragma once

#include <Arduino.h>

namespace SerialParser {

// Parser durumunu sıfırlar
void begin();

// Her loop()'ta çağrılır — gelen baytları okuyup tam satır oluşunca işler
void update();

}  // namespace SerialParser

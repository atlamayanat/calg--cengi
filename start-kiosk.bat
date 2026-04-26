@echo off
REM Perküsyon Sequencer - Otomatik tam ekran başlatma
setlocal

set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"

REM node_modules yoksa yükle
if not exist "node_modules" (
    call npm install
)

REM dist yoksa build al
if not exist "dist\index.html" (
    call npm run build
)

REM Vite preview sunucusunu arka planda başlat (port 4173)
start "perkusyon-server" /min cmd /c "npm run preview -- --host 127.0.0.1 --port 4173"

REM Sunucunun ayağa kalkmasını bekle
:waitloop
timeout /t 1 /nobreak >nul
powershell -NoProfile -Command "try { (Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:4173' -TimeoutSec 1).StatusCode } catch { exit 1 }" >nul 2>&1
if errorlevel 1 goto waitloop

REM Edge'i kiosk (tam ekran) modunda aç
start "" "msedge.exe" --kiosk "http://127.0.0.1:4173" --edge-kiosk-type=fullscreen --no-first-run --disable-features=TranslateUI

endlocal

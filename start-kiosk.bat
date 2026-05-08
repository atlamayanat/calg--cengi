@echo off
REM Perküsyon Sequencer - Otomatik tam ekran başlatma
setlocal

set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"

set "KIOSK_URL=http://127.0.0.1:4173"
set "EDGE_PROFILE=%PROJECT_DIR%edge-kiosk-profile"

REM --- Seri port iznini Edge'e politikadan otomatik ver (HKCU, admin gerekmez) ---
REM SerialAllowAllPortsForUrls: bu URL açıldığında "Port seç" diyaloğu çıkmaz, navigator.serial.getPorts() COM3'u doğrudan döner
reg add "HKCU\Software\Policies\Microsoft\Edge\SerialAllowAllPortsForUrls" /v "1" /t REG_SZ /d "%KIOSK_URL%" /f >nul 2>&1
reg add "HKCU\Software\Policies\Microsoft\Edge" /v "SerialAskForUrls" /t REG_DWORD /d 0 /f >nul 2>&1

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
powershell -NoProfile -Command "try { (Invoke-WebRequest -UseBasicParsing -Uri '%KIOSK_URL%' -TimeoutSec 1).StatusCode } catch { exit 1 }" >nul 2>&1
if errorlevel 1 goto waitloop

REM Edge'i kiosk (tam ekran) modunda aç — sabit user-data-dir ile izinler kalıcı kalsın
start "" "msedge.exe" --kiosk "%KIOSK_URL%" --edge-kiosk-type=fullscreen --no-first-run --disable-features=TranslateUI --user-data-dir="%EDGE_PROFILE%"

endlocal

@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   Job Agent - Portable USB Ollama Launcher
echo ===================================================
echo.

:: Define the target volume label you want to look for.
:: You can change this to match your USB drive's label (e.g. "JOB_AGENT", "OLLAMA_USB")
set "VOLUME_LABEL=JOB_AGENT"

echo Searching for USB drive with volume label "!VOLUME_LABEL!"...

:: Use PowerShell to find the drive letter of the USB drive with the specified label.
for /f "usebackq tokens=*" %%a in (`powershell -Command "Get-Volume | Where-Object { $_.FileSystemLabel -eq '!VOLUME_LABEL!' } | Select-Object -First 1 -ExpandProperty DriveLetter"`) do (
    set "DRIVE_LETTER=%%a"
)

if not defined DRIVE_LETTER (
    echo [WARNING] Could not find a drive labeled "!VOLUME_LABEL!".
    echo Searching for any volume containing 'JOB' or 'OLLAMA'...
    for /f "usebackq tokens=*" %%a in (`powershell -Command "Get-Volume | Where-Object { $_.FileSystemLabel -like '*JOB*' -or $_.FileSystemLabel -like '*OLLAMA*' } | Select-Object -First 1 -ExpandProperty DriveLetter"`) do (
        set "DRIVE_LETTER=%%a"
    )
)

if not defined DRIVE_LETTER (
    echo [ERROR] No suitable USB drive was found. 
    echo Please plug in your USB drive and ensure it has the volume label "!VOLUME_LABEL!".
    echo.
    pause
    exit /b 1
)

echo [SUCCESS] Found USB drive at !DRIVE_LETTER!:
set "OLLAMA_MODELS_PATH=!DRIVE_LETTER!:\ollama_models"
echo Setting OLLAMA_MODELS to: !OLLAMA_MODELS_PATH!

:: Create the folder if it does not exist on the USB drive
if not exist "!OLLAMA_MODELS_PATH!" (
    echo Directory does not exist on USB. Creating "!OLLAMA_MODELS_PATH!"...
    mkdir "!OLLAMA_MODELS_PATH!"
)

:: Set the environment variable locally for this session
set "OLLAMA_MODELS=!OLLAMA_MODELS_PATH!"

:: Now launch the local Ollama application with the environment variable set.
set "OLLAMA_EXE=%LOCALAPPDATA%\Programs\Ollama\ollama.exe"

if exist "%OLLAMA_EXE%" (
    echo Launching Ollama from %OLLAMA_EXE%...
    start "" "%OLLAMA_EXE%"
) else (
    echo [WARNING] Ollama executable not found at %OLLAMA_EXE%.
    echo Please make sure Ollama is installed. You can manually run it after setting OLLAMA_MODELS=!OLLAMA_MODELS_PATH!
)

echo.
echo You can now start the applications. OLLAMA_MODELS environment variable is active for this session.
echo.
pause

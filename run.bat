@echo off
setlocal enabledelayedexpansion
title AI Anime Boy Virtual Companion - Ren
echo ==============================================================
echo   Starting AI Anime Boy Virtual Companion (Ren)...
echo   Interactive Voice Conversation and Real-Time Facial Expressions
echo ==============================================================
echo.

cd /d "%~dp0"

:: 1. Check known specific install locations first
set "PYTHON_EXE="

if exist "%LOCALAPPDATA%\Python\bin\python.exe" (
    set "PYTHON_EXE=%LOCALAPPDATA%\Python\bin\python.exe"
) else if exist "%USERPROFILE%\.local\bin\python3.14.exe" (
    set "PYTHON_EXE=%USERPROFILE%\.local\bin\python3.14.exe"
) else if exist "%LOCALAPPDATA%\Programs\Python\Python314\python.exe" (
    set "PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python314\python.exe"
) else if exist "%LOCALAPPDATA%\Programs\Python\Python313\python.exe" (
    set "PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python313\python.exe"
) else if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
    set "PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
) else (
    :: Fallback to PATH py or python
    set "PYTHON_EXE=python"
)

echo Using Python executable: "!PYTHON_EXE!"
echo.
echo Launching companion server on http://127.0.0.1:5000 ...
echo Press Ctrl+C in this terminal window to stop the server.
echo.

:: Automatically open default browser after 2 seconds
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://127.0.0.1:5000"

"!PYTHON_EXE!" app.py

pause

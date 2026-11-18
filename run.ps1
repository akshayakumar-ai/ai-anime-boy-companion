# AI Anime Boy Virtual Companion - PowerShell Launcher
$Host.UI.RawUI.WindowTitle = "AI Anime Boy Virtual Companion - Ren"

Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "  Starting AI Anime Boy Virtual Companion (Ren)..." -ForegroundColor Magenta
Write-Host "  Interactive Voice Conversation & Real-Time Facial Expressions" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""

$pythonPaths = @(
    "$env:LOCALAPPDATA\Python\bin\python.exe",
    "$env:USERPROFILE\.local\bin\python3.14.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python314\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python313\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe",
    "python",
    "py"
)

$selectedPython = $null
foreach ($path in $pythonPaths) {
    if (Test-Path $path) {
        $selectedPython = $path
        break
    }
}

if (-not $selectedPython) {
    $selectedPython = "python"
}

Write-Host "Using Python: $selectedPython" -ForegroundColor Green
Write-Host "Launching companion on http://127.0.0.1:5000 ..." -ForegroundColor Yellow
Write-Host ""

Start-Job -ScriptBlock {
    Start-Sleep -Seconds 2
    Start-Process "http://127.0.0.1:5000"
} | Out-Null

& $selectedPython app.py

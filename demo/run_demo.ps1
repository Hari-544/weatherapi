# National Weather Big Data Analytics Platform - Demo Launcher
# Start both backend (FastAPI) and frontend (Vite/React) on Windows.
#
# Usage:
#   .\run_demo.ps1          # full setup + run
#   .\run_demo.ps1 -NoInstall   # skip pip/npm install
#   .\run_demo.ps1 -BackendOnly # run API only (no frontend)

param(
    [switch]$NoInstall,
    [switch]$BackendOnly
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"
$venvPy = Join-Path $backend ".venv\Scripts\python.exe"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  National Weather Platform - Demo" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# ---- 1. Backend venv + deps ----
if (-not (Test-Path $venvPy)) {
    Write-Host "[1/4] Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv (Join-Path $backend ".venv")
}
if (-not $NoInstall) {
    Write-Host "[2/4] Installing backend dependencies..." -ForegroundColor Yellow
    & $venvPy -m pip install --upgrade pip | Out-Null
    & $venvPy -m pip install -r (Join-Path $backend "requirements.txt")
}

# ---- 2. Frontend deps ----
if (-not $NoInstall -and -not $BackendOnly) {
    Write-Host "[3/4] Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location $frontend
    if (-not (Test-Path "node_modules")) {
        npm install
    }
    Pop-Location
}

# ---- 3. Start backend ----
Write-Host "[4/4] Starting backend API on http://127.0.0.1:8000 ..." -ForegroundColor Yellow
$backendProc = Start-Process -FilePath $venvPy -ArgumentList "-m", "uvicorn", "app.main:app", "--port", "8000" `
    -WorkingDirectory $backend -WindowStyle Hidden -PassThru

$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:8000/health" -UseBasicParsing -TimeoutSec 3
        if ($r.StatusCode -eq 200) { $ready = $true; break }
    } catch { }
}
if (-not $ready) {
    Write-Host "Backend failed to start. Check logs and try again." -ForegroundColor Red
    exit 1
}
Write-Host "  Backend ready: http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "  API docs (Swagger): http://127.0.0.1:8000/docs" -ForegroundColor Green

if ($BackendOnly) {
    Write-Host "Press Ctrl+C to stop the backend." -ForegroundColor Gray
    Wait-Process -Id $backendProc.Id
    exit 0
}

# ---- 4. Start frontend ----
Write-Host "Starting frontend on http://127.0.0.1:5173 ..." -ForegroundColor Yellow
Push-Location $frontend
$frontendProc = Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev", "--", "--host", "127.0.0.1" `
    -WorkingDirectory $frontend -WindowStyle Hidden -PassThru
Pop-Location

$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:5173/" -UseBasicParsing -TimeoutSec 3
        if ($r.StatusCode -eq 200) { $ready = $true; break }
    } catch { }
}
if ($ready) {
    Write-Host "Frontend ready: http://127.0.0.1:5173" -ForegroundColor Green
} else {
    Write-Host "Frontend may not be ready yet; open http://127.0.0.1:5173 manually." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Demo running! Open the dashboard:" -ForegroundColor Cyan
Write-Host "  Dashboard : http://127.0.0.1:5173" -ForegroundColor White
Write-Host "  Login     : admin / admin123   OR   analyst / analyst123" -ForegroundColor White
Write-Host ""
Write-Host "To stop, close this window or run: Stop-Process -Id $($backendProc.Id), $($frontendProc.Id) -Force" -ForegroundColor Gray
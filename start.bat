@echo off
echo ============================================================
echo  StormSight - AI Thunderstorm ^& Lightning Nowcasting System
echo ============================================================
echo.

:: Start Backend
echo [1/2] Starting StormSight Backend (FastAPI + AI Engine)...
start "StormSight Backend" cmd /k "cd /d %~dp0backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

:: Wait for backend to start
echo Waiting for backend to start...
timeout /t 4 /nobreak >nul

:: Start Frontend
echo [2/2] Starting StormSight Dashboard (React)...
start "StormSight Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ============================================================
echo  Services starting...
echo.
echo  Dashboard:  http://localhost:3000
echo  API Docs:   http://localhost:8000/docs
echo  CAP Feed:   http://localhost:8000/api/alerts/cap
echo  WebSocket:  ws://localhost:8000/ws/nowcast
echo ============================================================
echo.
echo Press any key to open the dashboard in your browser...
pause >nul
start http://localhost:3000

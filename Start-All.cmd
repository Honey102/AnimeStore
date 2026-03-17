@echo off
SET PATH=C:\Program Files\nodejs;%PATH%
title AnimeStore Servers

echo ====================================
echo Starting AnimeStore... (Press Ctrl+C to Stop)
echo ====================================
echo.

echo [1/2] Starting Backend (Port 5000)...
start "AnimeStore Backend" cmd /k "cd backend && node server.js"

echo [2/2] Starting Frontend (Port 5173)...
start "AnimeStore Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers have been launched in separate windows!
echo You can now open your browser to: http://localhost:5173
echo.
pause

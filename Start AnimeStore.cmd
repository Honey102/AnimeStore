@echo off
SET NODE_PATH=C:\Program Files\nodejs
SET PATH=%NODE_PATH%;%PATH%

echo.
echo  ========================================
echo   AnimeStore - Starting All Servers...
echo  ========================================
echo.

echo  [1/2] Starting Backend (Port 5000)...
start "AnimeStore Backend" cmd /k "cd /d "%~dp0backend" && "%NODE_PATH%\node.exe" server.js"

timeout /t 2 /nobreak >nul

echo  [2/2] Starting Frontend (Port 5173)...
start "AnimeStore Frontend" cmd /k "cd /d "%~dp0frontend" && "%NODE_PATH%\node.exe" "%NODE_PATH%\node_modules\npm\bin\npm-cli.js" run dev"

timeout /t 4 /nobreak >nul

echo.
echo  ========================================
echo   Both servers started!
echo   Website: http://localhost:5173
echo   API:     http://localhost:5000
echo  ========================================
echo.
echo  Opening website in browser...
start http://localhost:5173

pause

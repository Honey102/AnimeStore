@echo off
SET PATH=C:\Program Files\nodejs;%PATH%
echo Installing frontend dependencies...
"C:\Program Files\nodejs\npm.cmd" install
echo.
echo Done! Packages installed.
pause

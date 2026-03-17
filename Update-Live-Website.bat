@echo off
echo.
echo === AnimeStore - Live Website Update ===
echo.
set GIT="C:\Program Files\Git\bin\git.exe"

%GIT% add .
%GIT% commit -m "Update: %date% %time%"
%GIT% push origin main

echo.
echo ✅ Done! Vercel will auto-deploy in ~1 minute.
echo 🌐 Live at: https://anime-store-zeta-one.vercel.app
echo.
pause

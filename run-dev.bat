@echo off
title Khoi dong Bookstore Project
echo ==========================================
echo   KHOI DONG BACKEND VA FRONTEND DONG THOI
echo ==========================================
echo.

echo [+] Dang khoi dong Backend Spring Boot (cong 8080)...
start "Backend Spring Boot" cmd /k "cd /d C:\Users\ACER\Java6 && mvnw.cmd spring-boot:run"

echo [+] Dang khoi dong Frontend Next.js (cong 3000)...
start "Frontend Next.js" cmd /k "cd /d D:\Java6 && npm run dev"

echo [+] Dang khoi dong Python TTS Microservice (cong 8000)...
start "Python TTS Microservice" cmd /k "cd /d D:\Java6\TTS-Python-Service && python -m uvicorn main:app --port 8000 --reload"

echo.
echo [Hoan tat] Da mo 3 cua so lenh moi. Ban co the dong cua so nay.
pause

@echo off
echo Starting Backend (Spring Boot) in a new window...
start "Backend Spring Boot" cmd /k "cd /d C:\Users\ACER\Java6 && mvnw.cmd spring-boot:run"

echo Waiting 15 seconds for Backend to fully initialize...
ping 127.0.0.1 -n 15 > NUL

echo [+] Dang khoi dong Python AI Service (Image Search & TTS) at http://localhost:8000 ...
start "Python AI Service" cmd /k "cd /d D:\Java6\TTS-Python-Service && python -m uvicorn main:app --host 0.0.0.0 --port 8000"

echo [+] Dang khoi dong Frontend Next.js at http://localhost:3000 ...
start "Frontend Next.js" cmd /k "cd /d d:\Java6 && npm run dev"

echo Waiting 5 seconds for Frontend...
ping 127.0.0.1 -n 6 > NUL
start http://localhost:3000

echo.
echo [Hoan tat] Da khoi dong ca 3 dich vu (Java Backend 8080, Python AI 8000, Next.js 3000).
echo Done! All services are running in separate windows.
pause

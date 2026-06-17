@echo off
echo Starting Backend (Spring Boot) in a new window...
start "Backend" cmd /k "cd /d C:\Users\ACER\Java6 && mvnw.cmd spring-boot:run"

<<<<<<< HEAD
echo Waiting 15 seconds for Backend to fully initialize...
ping 127.0.0.1 -n 15 > NUL
=======
echo [+] Dang khoi dong Backend Spring Boot (cong 8080)...
start "Backend Spring Boot" cmd /k "cd /d D:\JAVADATN\Java6_Backend && mvnw.cmd spring-boot:run"
>>>>>>> origin/admin_1

echo [+] Dang khoi dong Frontend Next.js (cong 3000)...
start "Frontend Next.js" cmd /k "cd /d D:\JAVADATN\Java6_Fronend && npm run dev"

echo [+] Dang khoi dong Python TTS Microservice (cong 8000)...
start "Python TTS Microservice" cmd /k "cd /d D:\Java6\TTS-Python-Service && python -m uvicorn main:app --port 8000 --reload"

echo Waiting 5 seconds for Frontend...
ping 127.0.0.1 -n 6 > NUL
start http://localhost:3000

echo.
echo [Hoan tat] Da mo 3 cua so lenh moi. Ban co the dong cua so nay.
echo Done! Both services are running in separate windows.
pause

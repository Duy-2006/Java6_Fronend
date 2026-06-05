@echo off
echo Starting Backend (Spring Boot) in a new window...
start "Backend" cmd /k "cd /d D:\JAVADATN\Java6_Backend && mvnw.cmd spring-boot:run"

echo Waiting 15 seconds for Backend to fully initialize...
ping 127.0.0.1 -n 15 > NUL

echo Starting Frontend (Next.js) in a new window...
start "Frontend" cmd /k "npm run dev"

echo Waiting 5 seconds for Frontend...
ping 127.0.0.1 -n 6 > NUL
start http://localhost:3000

echo Done! Both services are running in separate windows.

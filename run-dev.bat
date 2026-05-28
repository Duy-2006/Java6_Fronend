@echo off
title Khoi dong Bookstore Project
echo ==========================================
echo   KHOI DONG BACKEND VA FRONTEND DONG THOI
echo ==========================================
echo.

echo [+] Dang khoi dong Backend Spring Boot (cong 8080)...
start "Backend Spring Boot" cmd /k "cd /d D:\JAVADATN\Java6_Backend && mvnw.cmd spring-boot:run"

echo [+] Dang khoi dong Frontend Next.js (cong 3000)...
start "Frontend Next.js" cmd /k "cd /d D:\JAVADATN\Java6_Fronend && npm run dev"

echo.
echo [Hoan tat] Da mo 2 cua so lenh moi. Ban co the dong cua so nay.
pause

@echo off
echo ===========================================
echo [START] Dang khoi dong he thong Du An Tot Nghiep...
echo ===========================================

:: 1. Chay Backend bang Maven he thong
echo CHAY BACKEND (Spring Boot)...
start "Backend - Spring Boot" cmd /k "cd /d D:\duantotnghiep\Java6_Backend && mvn spring-boot:run"

:: Doi 15 giay cho Backend khoi dong xong hoàn toan
echo Dang cho Backend tai du lieu (15s)...
ping 127.0.0.1 -n 15 > NUL

:: 2. Chay Frontend (Next.js)
echo CHAY FRONTEND (Next.js)...
start "Frontend - Next.js" cmd /k "cd /d D:\Program Files\duantotnghiepfronend\Java6_Fronend && npm run dev"

:: Doi 5 giay cho Frontend san sang
echo Dang cho Frontend khoi dong (5s)...
ping 127.0.0.1 -n 5 > NUL

:: 3. Tu dong mo trang web tren trinh duyet
echo [HOAN TAT] Dang mo trang web tren trinh duyet...
start http://localhost:3000

echo Cua so nay se tu dong dong sau 3 giay.
ping 127.0.0.1 -n 3 > NUL
exit

//                          .\run-dev.bat
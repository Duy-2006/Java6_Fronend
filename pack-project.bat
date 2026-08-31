@echo off
chcp 65001 > nul
echo Đang chạy script đóng gói dự án...
powershell -ExecutionPolicy Bypass -File "%~dp0pack-project.ps1"
pause

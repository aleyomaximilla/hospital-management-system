@echo off
title Hospital Management System Backend
echo ====================================================
echo  Starting Hospital Management System Server...
echo  http://localhost:5000
echo ====================================================
cd /d "%~dp0backend"
call npm start
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Trying direct node launch...
    call "%LOCALAPPDATA%\Programs\nodejs\node.exe" server.js
)
pause

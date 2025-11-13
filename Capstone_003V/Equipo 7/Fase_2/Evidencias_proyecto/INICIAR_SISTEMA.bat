@echo off
echo ========================================
echo    Sistema APT - Inicio Rapido
echo ========================================
echo.
echo Iniciando Backend...
echo.
cd proyecto-apt-backend
start cmd /k "npm run dev"
timeout /t 5
echo.
echo Backend iniciado en http://localhost:4000
echo.
echo Iniciando Frontend...
echo.
cd ..\proyecto-apt-frontend
start cmd /k "npm run dev"
echo.
echo Frontend iniciado en http://localhost:3000
echo.
echo ========================================
echo Sistema listo!
echo Backend: http://localhost:4000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:4000/api-docs
echo ========================================
echo.
pause

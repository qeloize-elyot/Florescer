@echo off
cd /d "%~dp0"

if not exist "node_modules\" (
  echo Instalando dependencias (primeira vez)...
  call npm install
)

if not exist "data\florescer.db" (
  echo Criando banco de dados...
  node seed.js
)

echo.
echo =========================================
echo   Florescer no ar: http://localhost:3001
echo   Pare com Ctrl+C
echo =========================================
echo.
node server.js
pause

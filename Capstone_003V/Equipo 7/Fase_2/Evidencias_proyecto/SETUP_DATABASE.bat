@echo off
echo ========================================
echo Configurando Base de Datos PostgreSQL
echo ========================================
echo.

REM Configurar variables
set PGPASSWORD=1234
set PGPATH=C:\Program Files\PostgreSQL\17\bin

echo 1. Creando base de datos apt_db...
"%PGPATH%\psql" -U postgres -c "CREATE DATABASE apt_db;"

echo.
echo 2. Ejecutando script de creacion de tablas...
"%PGPATH%\psql" -U postgres -d apt_db -f "Base de Datos Definitiva.TXT"

echo.
echo 3. Verificando tablas creadas...
"%PGPATH%\psql" -U postgres -d apt_db -c "\dt"

echo.
echo ========================================
echo Base de datos configurada exitosamente!
echo ========================================
echo.
echo Presiona cualquier tecla para continuar...
pause > nul

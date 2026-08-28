@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

if not exist "package.json" (
  echo No hay package.json: todavia no corriste 1-integrar.bat.
  pause & exit /b 1
)

echo.
echo == 1/6  Dependencias ==
call pnpm install
if errorlevel 1 goto :error

echo.
echo == 2/6  Variables de entorno ==
if exist ".env" (
  echo    .env ya existe, no lo toco.
) else (
  for /f "delims=" %%S in ('powershell -NoProfile -Command "$b=New-Object byte[] 32;[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b);[Convert]::ToBase64String($b)"') do set SECRET=%%S
  > .env echo DATABASE_URL=postgresql://mirage:mirage@localhost:5432/mirage
  >> .env echo BETTER_AUTH_SECRET=!SECRET!
  >> .env echo BETTER_AUTH_URL=http://localhost:3000
  echo    .env creado con un BETTER_AUTH_SECRET nuevo.
)

echo.
echo == 3/6  Postgres ==
docker compose up -d
if errorlevel 1 (
  echo    No arranco Docker. Abri Docker Desktop y volve a correr este .bat.
  goto :error
)
echo    Esperando a que la base acepte conexiones...
set INTENTOS=0
:esperar
set /a INTENTOS+=1
docker compose exec -T postgres pg_isready -U mirage -d mirage >nul 2>&1
if not errorlevel 1 goto :lista
if !INTENTOS! geq 30 (
  echo    La base no respondio despues de 60s. Mira: docker compose logs postgres
  goto :error
)
timeout /t 2 /nobreak >nul
goto :esperar
:lista
echo    Base lista.

echo.
echo == 4/6  Migraciones y contenido ==
call pnpm db:migrate:deploy
if errorlevel 1 goto :error
call pnpm db:seed
if errorlevel 1 goto :error

echo.
echo == 5/6  Primer empleado ==
echo    Sin esto no se puede entrar a /app: no hay registro publico y el
echo    alta de personas vive adentro de /app.
echo.
set /p BEMAIL=   Tu email:
set /p BPASS=   Password (8+ caracteres):
set /p BNOMBRE=   Nombre:
set /p BAPELLIDO=   Apellido:
call pnpm db:bootstrap "!BEMAIL!" "!BPASS!" "!BNOMBRE!" "!BAPELLIDO!"
if errorlevel 1 goto :error

echo.
echo == 6/6  Arrancando ==
echo    Abri http://localhost:3000 y entra por /ingresar con !BEMAIL!
echo    (Ctrl+C para frenar el servidor.)
echo.
call pnpm dev
exit /b 0

:error
echo.
echo  Algo fallo. Copiame el error de arriba tal cual.
pause
exit /b 1

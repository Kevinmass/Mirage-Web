@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

set FASES=fase-0-cimientos fase-1-web-publica fase-2-kernel-infra fase-3-identidad-organigrama fase-4-clientes fase-5-proyectos-tareas fase-6-notificaciones fase-7-solicitudes-portal
set P1=0001-feat-bootstrap-primer-empleado-y-ra-ces-del-organigr.patch
set P2=0002-chore-sacar-el-gitlink-del-worktree-formatear-fase-7.patch

if not exist ".git" (
  echo No estoy en la raiz de Mirage-Web. Pone este .bat ahi y volve a correrlo.
  pause & exit /b 1
)
if not exist "%P1%" goto :faltapatch
if not exist "%P2%" goto :faltapatch

echo.
echo == 1/6  Limpiando restos que rompen git ==
if exist ".git\index.lock" del /f /q ".git\index.lock"
if exist "_to_delete" rmdir /s /q "_to_delete"

rem El worktree huerfano de .claude\worktrees apunta a mirage-plataforma,
rem un repo que ya no existe. Git entra ahi durante el checkout y se muere
rem con "fatal: not a git repository". Tiene que salir del medio ANTES de
rem tocar el arbol, no despues.
if exist ".claude\worktrees\fase-0-cimientos\.git" (
  echo    Sacando el worktree huerfano de .claude\worktrees ...
  rmdir /s /q ".claude\worktrees" >nul 2>&1
  if exist ".claude\worktrees\fase-0-cimientos\.git" (
    move ".claude\worktrees" "..\_worktree-viejo-borrar-%RANDOM%" >nul 2>&1
  )
  if exist ".claude\worktrees\fase-0-cimientos\.git" (
    echo    No lo pude sacar, probablemente OneDrive lo tiene tomado.
    echo    Cerra OneDrive, movelo a mano fuera de Mirage-Web, y reintenta.
    pause ^& exit /b 1
  )
)

echo.
echo == 2/6  Trayendo el remoto ==
git fetch origin --prune
if errorlevel 1 goto :error

echo.
echo == 3/6  Comprobando que no se pierde nada ==
rem Red de seguridad: si alguna rama de fase tuviera commits que nunca
rem llegaron a staging, esto para antes de borrar nada.
for %%F in (%FASES%) do (
  git rev-parse --verify -q %%F >nul 2>&1
  if !errorlevel! equ 0 (
    git merge-base --is-ancestor %%F origin/staging
    if !errorlevel! neq 0 (
      echo.
      echo    ATENCION: %%F tiene commits que NO estan en staging.
      echo    Abortando sin borrar nada. Avisame y lo miramos juntos.
      pause ^& exit /b 1
    )
    echo    ok  %%F esta contenida en staging
  )
)

echo.
echo == 4/6  Integrando en main ==
if exist "src\db\bootstrap.ts" (
  echo    Ya estaba integrado, salteo este paso.
  goto :yaesta
)

git checkout main
if errorlevel 1 goto :error
git merge --ff-only origin/staging
if errorlevel 1 goto :error
if not exist "package.json" (
  echo    El merge dijo que anduvo pero no aparecio package.json. Paro aca.
  goto :error
)
echo    Codigo de las 8 fases en main. Aplicando los dos commits nuevos...
rem -3 usa merge a nivel blob en vez de reaplicar el diff linea por linea:
rem es lo que hace que no importe si el arbol quedo con CRLF.
git am -3 "%P1%" "%P2%"
if errorlevel 1 goto :errorpatch
if not exist "src\db\bootstrap.ts" (
  echo    Los commits dijeron que aplicaron pero falta src\db\bootstrap.ts. Paro aca.
  goto :error
)
:yaesta

echo.
echo == 5/6  Borrando worktrees y ramas de fase ==
echo    (tarda: cada worktree tiene su propio node_modules)
for %%F in (%FASES%) do git worktree remove --force ".worktrees/%%F" >nul 2>&1
git worktree prune
if exist ".worktrees" rmdir /s /q ".worktrees"
for %%F in (%FASES%) do git branch -D %%F >nul 2>&1

echo.
echo == 6/6  Alineando staging ==
git branch -f staging main

echo.
echo ================================================================
git log --oneline -3
echo.
if exist "package.json" (echo    package.json          OK) else (echo    package.json          FALTA)
if exist "next.config.ts" (echo    next.config.ts        OK) else (echo    next.config.ts        FALTA)
if exist "src\db\bootstrap.ts" (echo    src\db\bootstrap.ts   OK) else (echo    src\db\bootstrap.ts   FALTA)
echo.
echo  Si los tres dicen OK, segui con:   2-levantar.bat
echo.
echo  Y cuando estes conforme, publicas:
echo      git push origin main
echo      git push origin staging --force-with-lease
echo.
echo  Los .patch y este .bat los podes borrar despues, a mano.
echo ================================================================
pause
exit /b 0

:faltapatch
echo.
echo  Faltan los archivos .patch en esta carpeta. Tienen que estar los dos:
echo     %P1%
echo     %P2%
echo  Pedimelos de nuevo y los vuelvo a dejar ahi.
pause
exit /b 1

:errorpatch
echo.
echo  Fallo al aplicar los commits. Dejo el repo como estaba con:
git am --abort
echo  main quedo con el codigo de las 8 fases igual, solo faltan mis dos commits.
echo  Copiame el error de arriba tal cual.
pause
exit /b 1

:error
echo.
echo  Algo fallo. No sigas: copiame el error de arriba tal cual.
echo  Si quedo a medias un merge, lo deshaces con:  git merge --abort
pause
exit /b 1

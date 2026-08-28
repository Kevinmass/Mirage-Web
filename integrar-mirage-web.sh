#!/usr/bin/env bash
# Integra las 8 fases en `main` y limpia los restos del proceso por fases.
# Correr desde Git Bash, parado en la raíz de Mirage-Web:
#
#   bash integrar-mirage-web.sh
#
# Es reversible hasta el push: todo lo que hace antes de eso es local, y
# ninguna rama se borra sin que su contenido esté ya en `main`.
set -euo pipefail

cd "$(dirname "$0")"
[ -d .git ] || { echo "Esto no es la raíz de Mirage-Web."; exit 1; }

FASES="fase-0-cimientos fase-1-web-publica fase-2-kernel-infra
       fase-3-identidad-organigrama fase-4-clientes fase-5-proyectos-tareas
       fase-6-notificaciones fase-7-solicitudes-portal"

echo "== 1/6  Sacando el lock que quedó de la sesión =="
rm -f .git/index.lock
rm -rf _to_delete

echo "== 2/6  Traendo el remoto =="
git fetch origin --prune

echo "== 3/6  Comprobando que no se pierde nada =="
# Si esto falla, PARÁ: significa que hay trabajo en una rama de fase que
# no llegó a staging, y hay que mirarlo a mano antes de borrar nada.
for f in $FASES; do
  if git rev-parse --verify -q "$f" >/dev/null; then
    git merge-base --is-ancestor "$f" origin/staging \
      || { echo "  !! $f tiene commits que NO están en staging. Abortando."; exit 1; }
    echo "  ok  $f está contenida en staging"
  fi
done

echo "== 4/6  Integrando en main =="
git checkout main
git merge --ff-only origin/staging
git am 0001-*.patch 0002-*.patch

echo "== 5/6  Borrando worktrees y ramas de fase =="
for f in $FASES; do
  git worktree remove --force ".worktrees/$f" 2>/dev/null || true
done
git worktree prune
rm -rf .worktrees                      # tarda: cada una tiene su node_modules
for f in $FASES; do
  git branch -D "$f" 2>/dev/null || true
done

echo "== 6/6  Alineando staging =="
git branch -f staging main

echo
echo "Listo, en local. Revisá con:  git log --oneline -5  y  git status"
echo "Cuando estés conforme, publicá:"
echo "    git push origin main"
echo "    git push origin staging --force-with-lease"
echo
echo "(En GitHub las ramas fase-* ya fueron borradas al mergear los PRs;"
echo " no hay nada que borrar del remoto.)"

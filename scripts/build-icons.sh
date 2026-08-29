#!/bin/sh
# Rastérise assets/icon.svg vers les PNG de la PWA.
# À rejouer seulement quand le SVG change ; les PNG produits sont commités,
# la CI n'a donc besoin d'aucun outil graphique.
#
# Prérequis : sudo apt install librsvg2-bin

set -e

if ! command -v rsvg-convert >/dev/null 2>&1; then
  echo "rsvg-convert absent. Installer avec : sudo apt install librsvg2-bin" >&2
  exit 1
fi

mkdir -p public/icons

rsvg-convert -w 192 -h 192 assets/icon.svg -o public/icons/icon-192.png
rsvg-convert -w 512 -h 512 assets/icon.svg -o public/icons/icon-512.png
rsvg-convert -w 180 -h 180 assets/icon.svg -o public/icons/apple-touch-icon.png

echo "Icônes générées dans public/icons/"

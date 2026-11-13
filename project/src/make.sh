#!/usr/bin/env bash
# Пересобирает проектную работу: рисунки -> черновик -> поиск страниц -> итоговый .docx с оглавлением.
# Нужны: node (пакеты docx, playwright), LibreOffice (soffice), poppler-utils (pdftotext).
set -euo pipefail
cd "$(dirname "$0")"
TMP=$(mktemp -d)
node figures.js
OUT="$TMP/draft.docx" node build_docx.js
soffice --headless --convert-to pdf --outdir "$TMP" "$TMP/draft.docx" >/dev/null 2>&1
python3 find_pages.py "$TMP/draft.pdf" "$TMP/pages.json"
node build_docx.js "$TMP/pages.json"
rm -rf "$TMP"
node build_zayavka.js

"""Находит номера страниц заголовков в PDF (для автоматического оглавления).
Использование: python3 find_pages.py work.pdf pages.json
"""
import json
import subprocess
import sys

HEADINGS = [
    'ВВЕДЕНИЕ',
    'ГЛАВА 1. ТЕОРЕТИЧЕСКАЯ ЧАСТЬ',
    '1.1. Руккола: история, строение и польза',
    '1.2. Что такое эко-бокс',
    '1.3. Гидропоника – выращивание без почвы',
    '1.4. Условия, необходимые рукколе',
    'ГЛАВА 2. ПРАКТИЧЕСКАЯ ЧАСТЬ',
    '2.1. Оборудование и материалы',
    '2.2. Ход работы',
    '2.3. Наблюдения и результаты',
    '2.4. Сравнение способов и расчёт затрат',
    '2.5. Продукт проекта: сайт-визитка и игра «Гидро-огород»',
    'ЗАКЛЮЧЕНИЕ',
    'СПИСОК ЛИТЕРАТУРЫ',
    'ПРИЛОЖЕНИЯ',
]

pdf, out = sys.argv[1], sys.argv[2]
n = int([l for l in subprocess.run(['pdfinfo', pdf], capture_output=True, text=True).stdout.splitlines() if l.startswith('Pages:')][0].split()[1])
pages = {}
for p in range(3, n + 1):  # 1 – титульный лист, 2 – содержание
    text = subprocess.run(['pdftotext', '-f', str(p), '-l', str(p), '-layout', pdf, '-'], capture_output=True, text=True).stdout
    lines = [' '.join(l.split()) for l in text.splitlines()]
    for h in HEADINGS:
        if h not in pages and any(l.startswith(h) for l in lines):
            pages[h] = p
missing = [h for h in HEADINGS if h not in pages]
if missing:
    print('Не найдены:', missing)
json.dump(pages, open(out, 'w'), ensure_ascii=False, indent=1)
print(pages, 'всего страниц:', n)

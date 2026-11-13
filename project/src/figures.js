// Рисует иллюстрации для проектной работы (SVG -> PNG через Playwright).
// Запуск: node project/src/figures.js
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const data = require('./data');

const OUT = path.join(__dirname, '..', 'img');
const FONT = "'Liberation Serif','Times New Roman',serif";

// ---------- Рисунок: схема гидропонного эко-бокса (метод Кратки) ----------
function leaf(cx, cy, len, angle, fill) {
  // Рассечённый лист рукколы: черешок + несколько лопастей
  const l = len;
  const d = `M0,0 C${l * 0.1},-3 ${l * 0.25},-4 ${l * 0.3},-2
    C${l * 0.32},-10 ${l * 0.4},-12 ${l * 0.45},-4
    C${l * 0.5},-14 ${l * 0.62},-16 ${l * 0.66},-6
    C${l * 0.72},-18 ${l * 0.95},-16 ${l},0
    C${l * 0.95},16 ${l * 0.72},18 ${l * 0.66},6
    C${l * 0.62},16 ${l * 0.5},14 ${l * 0.45},4
    C${l * 0.4},12 ${l * 0.32},10 ${l * 0.3},2
    C${l * 0.25},4 ${l * 0.1},3 0,0 Z`;
  return `<path d="${d}" transform="translate(${cx},${cy}) rotate(${angle})" fill="${fill}" stroke="#2e5e1f" stroke-width="1.2"/>
  <line x1="0" y1="0" x2="${l * 0.95}" y2="0" transform="translate(${cx},${cy}) rotate(${angle})" stroke="#2e5e1f" stroke-width="1"/>`;
}

function plant(x, baseY, scale) {
  const fills = ['#6fae4a', '#5c9e3a', '#7dbb55'];
  const angles = [-150, -120, -95, -75, -55, -30, -165, -10];
  return angles
    .map((a, i) => leaf(x, baseY, (70 + (i % 3) * 14) * scale, a, fills[i % 3]))
    .join('\n');
}

function roots(x, topY, bottomY) {
  let s = '';
  const n = 9;
  for (let i = 0; i < n; i++) {
    const dx = (i - (n - 1) / 2) * 7;
    const len = bottomY - topY - (i % 3) * 18;
    s += `<path d="M${x + dx * 0.4},${topY} C${x + dx},${topY + len * 0.35} ${x + dx * 1.6},${topY + len * 0.7} ${x + dx * 1.3 + ((i % 2) ? 6 : -6)},${topY + len}"
      fill="none" stroke="#c9a46a" stroke-width="2.2" stroke-linecap="round"/>`;
  }
  return s;
}

function schemeSVG() {
  const W = 980, H = 640;
  const box = { x: 250, y: 300, w: 470, h: 270 };
  const lidY = box.y, solTop = 420;
  const cups = [345, 485, 625];
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="${FONT}" font-size="21">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <!-- фитолампа -->
  <rect x="300" y="38" width="370" height="26" rx="8" fill="#455a64"/>
  <rect x="312" y="62" width="346" height="8" rx="3" fill="#f3c74a"/>
  <line x1="485" y1="20" x2="485" y2="38" stroke="#455a64" stroke-width="3"/>`;
  for (let i = 0; i < 7; i++) {
    const x = 330 + i * 52;
    s += `<line x1="${x}" y1="76" x2="${x + (i - 3) * 14}" y2="170" stroke="#f3c74a" stroke-width="3" stroke-dasharray="8 7"/>`;
  }
  // контейнер (разрез)
  s += `
  <rect x="${box.x}" y="${solTop}" width="${box.w}" height="${box.y + box.h - solTop}" fill="#bfe1f2"/>
  <line x1="${box.x}" y1="${solTop}" x2="${box.x + box.w}" y2="${solTop}" stroke="#4a90b8" stroke-width="2.5"/>
  <path d="M${box.x},${box.y} V${box.y + box.h} H${box.x + box.w} V${box.y}" fill="none" stroke="#37474f" stroke-width="12"/>
  <rect x="${box.x - 14}" y="${lidY - 14}" width="${box.w + 28}" height="16" rx="4" fill="#546e7a"/>`;
  // горшочки, корни, растения
  cups.forEach((cx, i) => {
    s += roots(cx, 372, 548 - i * 8);
    s += `<path d="M${cx - 34},${lidY - 16} L${cx - 22},372 L${cx + 22},372 L${cx + 34},${lidY - 16} Z" fill="#8d6e63" stroke="#4e342e" stroke-width="2"/>`;
    for (let k = 0; k < 4; k++) {
      const yy = lidY + 4 + k * 17;
      s += `<line x1="${cx - 30 + k * 3}" y1="${yy}" x2="${cx + 30 - k * 3}" y2="${yy}" stroke="#4e342e" stroke-width="1.4"/>`;
    }
    s += plant(cx, lidY - 18, 1 + (i === 1 ? 0.15 : 0));
  });
  // пузырьки воздуха в зазоре (подпись)
  s += `<text x="415" y="404" text-anchor="middle" font-size="18" fill="#37474f" font-style="italic">воздух</text>`;

  // выноски
  const callouts = [
    { n: 1, x: 300, y: 50, tx: 120, ty: 52, text: 'Фитолампа' },
    { n: 2, x: 600, y: 210, tx: 790, ty: 160, text: 'Руккола' },
    { n: 3, x: 712, y: 292, tx: 790, ty: 250, text: 'Крышка' },
    { n: 4, x: 650, y: 350, tx: 790, ty: 330, text: 'Горшочек-сеточка' },
    { n: 4.1, x: 0, y: 0, tx: 790, ty: 356, text: 'с субстратом', noLine: true },
    { n: 5, x: 700, y: 400, tx: 790, ty: 420, text: 'Воздушный зазор' },
    { n: 6, x: 690, y: 500, tx: 790, ty: 505, text: 'Питательный' },
    { n: 6.1, x: 0, y: 0, tx: 790, ty: 531, text: 'раствор', noLine: true },
    { n: 7, x: 256, y: 520, tx: 70, ty: 520, text: 'Непрозрачный', anchor: 'start' },
    { n: 7.1, x: 0, y: 0, tx: 70, ty: 546, text: 'контейнер', noLine: true, anchor: 'start' },
    { n: 8, x: 362, y: 478, tx: 70, ty: 430, text: 'Корни', anchor: 'start' },
  ];
  callouts.forEach((c) => {
    const left = c.tx < 250;
    if (!c.noLine) {
      const lx = left ? c.tx + 150 : c.tx - 8;
      s += `<line x1="${c.x}" y1="${c.y}" x2="${lx}" y2="${c.ty - 6}" stroke="#222" stroke-width="1.3"/>
      <circle cx="${c.x}" cy="${c.y}" r="3.5" fill="#222"/>`;
    }
    s += `<text x="${left ? c.tx : c.tx}" y="${c.ty}" fill="#111">${c.text}</text>`;
  });
  // фигурная скобка зазора
  s += `<path d="M732,374 q10,0 10,10 v12 q0,6 8,8 q-8,2 -8,8 v4 q0,10 -10,10" fill="none" stroke="#222" stroke-width="1.5"/>`;
  s += `</svg>`;
  return s;
}

// ---------- Рисунок: график роста ----------
function chartSVG() {
  const W = 980, H = 560;
  const L = 90, R = 190, T = 30, B = 80;
  const { days, soil, hydro } = data.growth;
  const xMax = 28, yMax = 16;
  const X = (d) => L + (d / xMax) * (W - L - R);
  const Y = (v) => H - B - (v / yMax) * (H - T - B);
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="${FONT}" font-size="22">
  <rect width="${W}" height="${H}" fill="#fff"/>`;
  for (let v = 0; v <= yMax; v += 2) {
    s += `<line x1="${L}" y1="${Y(v)}" x2="${W - R}" y2="${Y(v)}" stroke="#e3e3e3" stroke-width="1"/>
    <text x="${L - 12}" y="${Y(v) + 7}" text-anchor="end" fill="#333">${v}</text>`;
  }
  days.forEach((d) => {
    s += `<text x="${X(d)}" y="${H - B + 30}" text-anchor="middle" fill="#333">${d}</text>`;
  });
  s += `<line x1="${L}" y1="${H - B}" x2="${W - R}" y2="${H - B}" stroke="#333" stroke-width="1.5"/>
  <line x1="${L}" y1="${T}" x2="${L}" y2="${H - B}" stroke="#333" stroke-width="1.5"/>
  <text x="${(L + W - R) / 2}" y="${H - 18}" text-anchor="middle" fill="#111">День наблюдения</text>
  <text transform="translate(28,${(T + H - B) / 2}) rotate(-90)" text-anchor="middle" fill="#111">Средняя высота, см</text>`;
  const line = (arr) => arr.map((v, i) => `${i ? 'L' : 'M'}${X(days[i])},${Y(v)}`).join(' ');
  s += `<path d="${line(soil)}" fill="none" stroke="#8a7a68" stroke-width="3.5" stroke-dasharray="10 7"/>`;
  s += `<path d="${line(hydro)}" fill="none" stroke="#2f7d32" stroke-width="4"/>`;
  soil.forEach((v, i) => {
    s += `<rect x="${X(days[i]) - 6}" y="${Y(v) - 6}" width="12" height="12" fill="#fff" stroke="#8a7a68" stroke-width="2.5"/>`;
  });
  hydro.forEach((v, i) => {
    s += `<circle cx="${X(days[i])}" cy="${Y(v)}" r="6.5" fill="#2f7d32"/>`;
  });
  const lh = hydro[hydro.length - 1], ls = soil[soil.length - 1];
  s += `<text x="${X(28) + 14}" y="${Y(lh) + 7}" fill="#2f7d32" font-weight="bold">Гидропоника</text>
  <text x="${X(28) + 14}" y="${Y(lh) + 33}" fill="#2f7d32">${String(lh).replace('.', ',')} см</text>
  <text x="${X(28) + 14}" y="${Y(ls) + 7}" fill="#6d5f50" font-weight="bold">Почва</text>
  <text x="${X(28) + 14}" y="${Y(ls) + 33}" fill="#6d5f50">${String(ls).replace('.', ',')} см</text>`;
  s += `</svg>`;
  return s;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 2 });
  for (const [name, svg] of [['scheme', schemeSVG()], ['growth', chartSVG()]]) {
    fs.writeFileSync(path.join(OUT, name + '.svg'), svg);
    await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
    const el = await page.$('svg');
    await el.screenshot({ path: path.join(OUT, name + '.png') });
    console.log('ok', name);
  }
  await browser.close();
})();

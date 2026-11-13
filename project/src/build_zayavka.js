// Заявка на участие (Приложение 1 к Положению о конференции «АгроБудущее: идеи школьников»)
// Запуск: node project/src/build_zayavka.js
const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } = require('docx');

const FONT = 'Times New Roman';
const t = (text, o = {}) => new TextRun({ text, font: FONT, size: 28, highlight: o.hl ? 'yellow' : undefined, bold: o.bold });
const b = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
const borders = { top: b, bottom: b, left: b, right: b };
const W1 = 4300, W2 = 5600;
const rows = [
  ['ФИО (последнее при наличии) участника', ''],
  ['Класс', '6 «__»'],
  ['Образовательная организация', ''],
  ['Тема', 'Выращивание рукколы в эко-боксах в условиях школьного кружка'],
  ['Секция', 'Растениеводство'],
  ['Возраст участника, класс', '__ лет, 6 класс'],
  ['ФИО руководителя', ''],
  ['Контактные данные (телефон, электронная почта)', ''],
  ['Должность и место работы руководителя', ''],
  ['Необходимое оборудование', 'Проектор, экран, ноутбук с выходом в интернет (показ сайта и игры)'],
];
const cell = (text, w, hl) =>
  new TableCell({
    borders,
    width: { size: w, type: WidthType.DXA },
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
    children: [new Paragraph({ children: [t(text, { hl })] })],
  });

const doc = new Document({
  styles: { default: { document: { run: { font: FONT, size: 28 } } } },
  sections: [
    {
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 567 } } },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, children: [t('ЗАЯВКА', { bold: true })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [t('на участие в республиканской научно-практической конференции')] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [t('«АгроБудущее: идеи школьников»')] }),
        new Table({
          width: { size: W1 + W2, type: WidthType.DXA },
          columnWidths: [W1, W2],
          rows: rows.map(([a, v]) => new TableRow({ children: [cell(a, W1), cell(v, W2, !v || v.includes('__'))] })),
        }),
        new Paragraph({ spacing: { before: 240 }, children: [t('Жёлтым выделены поля, которые нужно заполнить.', { hl: true })] }),
      ],
    },
  ],
});
const out = path.join(__dirname, '..', 'Заявка_АгроБудущее.docx');
Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(out, buf); console.log('Готово:', out); });

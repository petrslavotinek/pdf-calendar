const moment = require('moment');
require('moment/locale/cs');
moment.locale('cs');
const config = require('config');
const _ = require('lodash');
const PDFDocument = require('pdfkit');
const fs = require('fs');

const { createMonth } = require('./month');
const { createPage } = require('./page');

const calendars = config.get('calendars');
const { calendarsPerPage, size, margin } = config.get('layout');

const pages = _
  .chain(calendars)
  .map(({ year, months }) => months
    .map((month) => createMonth(year, month - 1)))
  .flatten()
  .chunk(calendarsPerPage)
  .map((months) => createPage(months))
  .value();

const dir = './out';
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

const maxRows = _.chain(pages).map('rows.length').max().value();
const rowHeight = (size[1] - 2 * margin) / maxRows;
const colWidth = (size[0] - 2 * margin) / 7;

const getRect = (row, col) => ({
  x: col * colWidth + margin,
  y: row * rowHeight + margin,
  width: colWidth,
  height: rowHeight
});

const drawRect = (doc, x, y, width, height) => {
  doc.rect(x, y, width, height).stroke();
};

const drawDayTitle = (doc, x, y, title) => {
  doc.text(title, x, y);
};

const doc = new PDFDocument({
  autoFirstPage: false,
  size,
  margin
});
doc.pipe(fs.createWriteStream(`${dir}/calendar.pdf`));

pages.forEach((page, i) => {
  doc.addPage();

  page.rows.forEach((cols, row) =>
    cols.forEach(({ date, active, day, month, year }, col) => {
      // TODO
      const { x, y, width, height } = getRect(row, col);
      drawRect(doc, x, y, width, height);

      drawDayTitle(doc, x, y, day);
    }));
});

doc.end();



console.log()
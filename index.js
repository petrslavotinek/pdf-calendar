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
const {
  calendarsPerPage,
  size,
  margin,
  weekdays,
  borderColor,
  fontColor,
  holidayColor,
  inactiveColor,
  weekdayTitleSize,
  dayTitleSize,
  holidayTitleSize,
  holidayCharsPerLine,
  holidayLineHeight,
  monthTitleSize,
  yearTitleSize,
  separatingLineWidth,
  weekdayColor,
  backgroundColor,
  dayFillColor,
  lineWidth
} = config.get('layout');
const holidays = config.get('holidays');

const pages = _
  .chain(calendars)
  .map(({ year, months }) => _
    .chain(months)
    .map((month) => createMonth(year, month - 1))
    .chunk(calendarsPerPage)
    .map((months) => createPage(months, holidays))
    .value())
  .flatten()
  .value();

const dir = './out';
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

const weekdaysHeight = weekdays.show ? weekdays.height : 0;
const maxRows = _.chain(pages).map('rows.length').max().value();
const rowHeight = (size[1] - 2 * margin - weekdaysHeight) / maxRows;
const colWidth = (size[0] - 2 * margin) / 7;

console.log(`${colWidth / 2.835} x ${rowHeight / 2.835}`);

const getRect = (row, col) => ({
  x: col * colWidth + margin,
  y: row * rowHeight + margin + weekdaysHeight,
  width: colWidth,
  height: rowHeight
});

const drawRect = (doc, x, y, width, height) => {
  doc
    .rect(x, y, width, height)
    .lineWidth(lineWidth)
    .strokeColor(borderColor)
    .stroke();
  doc
    .rect(x, y, width, height)
    .fillColor(dayFillColor)
    .fill();
};

const drawWeekdayTitle = (doc, x, y, width, title) => {
  doc
    .fontSize(weekdayTitleSize)
    .fillColor(weekdayColor)
    .text(title, x, y, {
      width,
      align: 'center'
    });
};

const drawDayTitle = (doc, x, y, title, isActive, isHoliday) => {
  doc
    .fillColor(isActive
      ? isHoliday
        ? holidayColor
        : fontColor
      : inactiveColor)
    .fontSize(dayTitleSize)
    .text(title, x, y);
};

const drawHoliday = (doc, x, y, width, title) => {
  doc
    .fillColor(fontColor)
    .fontSize(holidayTitleSize)
    .text(title, x, y, {
      width,
      align: 'right'
    });
};

const drawMonth = (doc, x, y, width, title) => {
  doc
    .fillColor(fontColor)
    .fontSize(monthTitleSize)
    .text(title, x, y, {
      width,
      align: 'right'
    });
};

const drawYear = (doc, x, y, width, title) => {
  doc
    .fillColor(fontColor)
    .fontSize(yearTitleSize)
    .text(title, x, y, {
      width,
      align: 'right'
    });
};

const doc = new PDFDocument({
  autoFirstPage: false,
  size,
  margin
});
doc.pipe(fs.createWriteStream(`${dir}/calendar_${moment().unix()}.pdf`));
doc.font('fonts/Quicksand-Regular.ttf');

pages.forEach((page, i) => {
  doc.addPage();

  doc
    .fillColor(backgroundColor)
    .rect(0, 0, size[0], size[1])
    .fill();

  if (weekdays.show) {
    weekdays.titles.forEach((title, i) => {
      const x = margin + i * colWidth;
      drawWeekdayTitle(doc, x, margin, colWidth, title);
    });
  }

  const drawCell = (row, col, { date, isActive, day, month, year, holiday, isHoliday }) => {
    const { x, y, width, height } = getRect(row, col);
    drawRect(doc, x, y, width, height);
    if (!isActive) {
      return;
    }
    drawDayTitle(doc, x + 2, y - 3, day, isActive, isHoliday);
    if (month) {
      drawMonth(doc, x + 2, y - 1, width - 4, month);
    }
    if (year) {
      drawYear(doc, x + 2, doc.y, width - 4, year);
    }
    if (holiday) {
      drawHoliday(doc, x + 2, y + rowHeight - Math.ceil(holiday.length / holidayCharsPerLine) * holidayLineHeight, width - 4, holiday);
    }
  };

  const drawEmptyCell = (row, col) => {
    const { x, y, width, height } = getRect(row, col);
    drawRect(doc, x, y, width, height);
  };

  const drawSeparatingLine = (row, col) => {
    const { x, y, width, height } = getRect(row, col);
    doc.lineWidth(separatingLineWidth);
    if (col > 1) {
      doc
        .moveTo(margin, y + height)
        .lineTo(x, y + height)
        .lineTo(x, y);
    } else {
      doc
        .moveTo(margin, y);
    }
    doc
      .lineTo(size[0] - margin, y)
      .stroke();
  };

  page.rows.forEach((cols, row) =>
    cols.forEach((cell, col) => drawCell(row, col, cell))
  );
  for (let row = page.rows.length; row < maxRows; row++) {
    _.times(7).forEach((col) => drawEmptyCell(row, col));
  }
  page.rows.forEach((cols, row) => {
    cols
      .forEach((cell, col) => {
        if (cell.isActive && row > 1 && cell.date.date() === 1) {
          drawSeparatingLine(row, col);
        }
      });
  });
});

doc.end();
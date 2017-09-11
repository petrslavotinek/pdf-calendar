const _ = require('lodash');
const moment = require('moment');

const createDay = (date, active = true) => {
  const day = date.date();
  return {
    date: moment(date),
    active,
    dayOfWeek: date.isoWeekday(),
    day: date.format('D'),
    month: day === 1 ? date.format('MMMM') : null,
    year: day === 1 && date.month() === 0 ? date.format('YYYY') : null
  };
};

const createPage = (months) => {

  const rows = [[]];
  let rowIndex = 0;
  let dayIndex = 0;

  const addDay = (day) => {
    if (dayIndex !== 0 && dayIndex % 7 === 0) {
      rows[++rowIndex] = [];
      dayIndex = 0;
    }
    rows[rowIndex][dayIndex++] = day;
  };

  // dny od zacatku tydne prvniho mesice
  const first = months[0].days[0];
  _
    .times(first.dayOfWeek - 1)
    .forEach((i) => {
      addDay(createDay(moment(first.date).subtract(first.dayOfWeek - i, 'day'), false));
    });

  // ostatni dny
  months.forEach(({ days }) =>
    days.forEach(({ date, dayOfWeek }) => {
      addDay(createDay(date));
    }));

  // dny do konce tydne posledniho mesice
  const last = months[months.length - 1].days[months[months.length - 1].days.length - 1];
  _
    .times(7 - last.dayOfWeek)
    .forEach((i) => {
      addDay(createDay(moment(last.date).add(i + 1, 'day'), false));
    });

  return {
    rows
  };
};

exports.createPage = createPage;
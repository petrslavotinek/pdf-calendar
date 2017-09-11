const moment = require('moment');

const createMonth = (year, month) => {

  const date = moment([year, month]);

  const days = [];  
  for (let day = moment(date); day.month() === date.month(); day.add(1, 'day')) {
    const date = moment(day);
    days.push({
      date,
      title: date.format('D'),
      dayOfWeek: date.isoWeekday(),
      last: false
    });
  }
  days[days.length - 1].last = true;

  return {
    year,
    month,
    date,
    title: date.format('MMMM'),
    days
  };
};

exports.createMonth = createMonth;
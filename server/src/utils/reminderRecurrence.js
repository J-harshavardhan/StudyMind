const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_OCCURRENCES = 370;

export function addDays(dateKey, days) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function occurrenceDates(reminder, fromDateKey, throughDateKey) {
  const dates = [];
  let cursor = reminder.dateKey;
  let count = 0;
  while (cursor < fromDateKey && reminder.repeat !== 'none' && count < MAX_OCCURRENCES) {
    cursor = nextDate(cursor, reminder.repeat);
    count += 1;
  }
  while (cursor <= throughDateKey && count < MAX_OCCURRENCES) {
    if (cursor >= fromDateKey && (reminder.repeat !== 'weekdays' || isWeekday(cursor))) dates.push(cursor);
    if (reminder.repeat === 'none') break;
    cursor = nextDate(cursor, reminder.repeat);
    count += 1;
  }
  return dates;
}

export function nextDate(dateKey, repeat) {
  if (repeat === 'weekly') return addDays(dateKey, 7);
  return addDays(dateKey, 1);
}

export function isWeekday(dateKey) {
  const day = new Date(`${dateKey}T12:00:00Z`).getUTCDay();
  return day > 0 && day < 6;
}

export function dateRange(start, days) {
  return { from: start, through: addDays(start, days) };
}

export function occurrenceView(reminder, dateKey) {
  const state = reminder.occurrenceStates?.find((item) => item.dateKey === dateKey);
  return {
    ...reminder,
    _id: `${reminder._id}:${dateKey}`,
    seriesId: reminder._id,
    occurrenceDateKey: dateKey,
    status: state?.status || (dateKey === reminder.dateKey ? reminder.status : 'upcoming'),
    snoozedUntil: state?.snoozedUntil,
    occurrenceStates: undefined
  };
}

export function baseReminderId(id) {
  return String(id).split(':')[0];
}

export const DAY_MS_PER_DAY = DAY_MS;

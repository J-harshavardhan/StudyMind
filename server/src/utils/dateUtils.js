const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/u;

export function isValidDayKey(value) {
  if (typeof value !== 'string' || !DAY_KEY.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return date.toISOString().slice(0, 10) === value;
}

export function dayKey(date = new Date(), timeZone = 'UTC') {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) throw new Error('Invalid date');
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(value);
  const values = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function todayKey(timeZone = 'UTC') {
  return dayKey(new Date(), timeZone);
}

export function addDays(value, amount) {
  if (!isValidDayKey(value) || !Number.isInteger(amount)) throw new Error('Invalid day key or amount');
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

export function monthRange(year, month) {
  if (typeof year === 'string' && /^\d{4}-\d{2}$/u.test(year)) {
    [year, month] = year.split('-').map(Number);
  }
  if (!Number.isInteger(Number(year)) || !Number.isInteger(Number(month)) || Number(month) < 1 || Number(month) > 12) {
    throw new Error('Invalid month');
  }
  const normalizedYear = Number(year);
  const normalizedMonth = Number(month);
  const start = `${String(normalizedYear).padStart(4, '0')}-${String(normalizedMonth).padStart(2, '0')}-01`;
  const end = new Date(Date.UTC(normalizedYear, normalizedMonth, 0)).toISOString().slice(0, 10);
  return { start, end };
}

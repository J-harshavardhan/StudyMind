import Note from '../models/Note.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { addDays, dayKey, isValidDayKey, monthRange, todayKey } from '../utils/dateUtils.js';

const timezoneFor = async (userId) => {
  const user = await User.findById(userId).select('settings.timezone').lean();
  return user?.settings?.timezone || 'UTC';
};

const validTimezone = (value) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
    return value;
  } catch {
    return 'UTC';
  }
};

export async function getMonth(req, res, next) {
  try {
    const year = Number(req.query.year);
    const month = Number(req.query.month);
    const range = monthRange(year, month);
    const timezone = validTimezone(await timezoneFor(req.user.sub));
    const [tasks, notes] = await Promise.all([
      Task.find({ user: req.user.sub, dateKey: { $gte: range.start, $lte: range.end } }).lean(),
      Note.find({ user: req.user.sub, deadline: { $ne: null } }).lean()
    ]);
    const buckets = [];
    for (let cursor = range.start; isValidDayKey(cursor) && cursor <= range.end; cursor = addDays(cursor, 1)) {
      const dayTasks = tasks.filter((task) => task.dateKey === cursor);
      const dayNotes = notes
        .filter((note) => dayKey(note.deadline, timezone) === cursor)
        .map((note) => ({ id: note._id, title: note.title }));
      buckets.push({
        dateKey: cursor,
        noteDeadlines: dayNotes,
        taskCount: dayTasks.length,
        completedCount: dayTasks.filter((task) => task.isCompleted).length
      });
      if (cursor === range.end) break;
    }
    return res.json({ year, month, days: buckets });
  } catch (error) {
    error.status = error.message === 'Invalid month' ? 400 : error.status;
    return next(error);
  }
}

export async function getUpcoming(req, res, next) {
  try {
    const days = Number(req.query.days || 14);
    if (!Number.isInteger(days) || days < 1 || days > 60) {
      const error = new Error('days must be between 1 and 60');
      error.status = 400;
      throw error;
    }
    const timezone = validTimezone(await timezoneFor(req.user.sub));
    const start = todayKey(timezone);
    const end = addDays(start, days - 1);
    const [tasks, notes] = await Promise.all([
      Task.find({ user: req.user.sub, dateKey: { $gte: start, $lte: end }, isCompleted: false }).lean(),
      Note.find({ user: req.user.sub, deadline: { $ne: null } }).lean()
    ]);
    const events = [
      ...tasks.map((task) => ({ type: 'task', id: task._id, title: task.title, dateKey: task.dateKey })),
      ...notes
        .map((note) => ({ type: 'note', id: note._id, title: note.title, dateKey: dayKey(note.deadline, timezone) }))
        .filter((note) => note.dateKey >= start && note.dateKey <= end)
    ].sort((left, right) => left.dateKey.localeCompare(right.dateKey));
    return res.json({ days, events });
  } catch (error) {
    return next(error);
  }
}

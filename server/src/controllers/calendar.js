import Note from '../models/Note.js';
import Reminder from '../models/Reminder.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { addDays, dayKey, isValidDayKey, monthRange, todayKey } from '../utils/dateUtils.js';
import { occurrenceDates, occurrenceView } from '../utils/reminderRecurrence.js';

const timezoneFor = async (userId) => {
  const user = await User.findById(userId).select('settings.timezone').lean();
  return user?.settings?.timezone || 'Asia/Kolkata';
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
    const [tasks, notes, reminderSeries] = await Promise.all([
      Task.find({ user: req.user.sub, dateKey: { $gte: range.start, $lte: range.end } }).lean(),
      Note.find({ user: req.user.sub, deadline: { $ne: null } }).lean(),
      Reminder.find({ user: req.user.sub, dateKey: { $lte: range.end } }).lean()
    ]);
    const buckets = [];
    for (let cursor = range.start; isValidDayKey(cursor) && cursor <= range.end; cursor = addDays(cursor, 1)) {
      const dayTasks = tasks.filter((task) => task.dateKey === cursor);
      const dayNotes = notes
        .filter((note) => dayKey(note.deadline, timezone) === cursor)
        .map((note) => ({ id: note._id, title: note.title }));
      const dayReminders = reminderSeries
        .flatMap((reminder) => occurrenceDates(reminder, cursor, cursor)
          .map((dateKey) => occurrenceView(reminder, dateKey)))
        .map((reminder) => ({ id: reminder._id, title: reminder.title, time: reminder.time, status: reminder.status }));
      buckets.push({
        dateKey: cursor,
        noteDeadlines: dayNotes,
        reminders: dayReminders,
        reminderCount: dayReminders.length,
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
    const [tasks, notes, reminderSeries] = await Promise.all([
      Task.find({ user: req.user.sub, dateKey: { $gte: start, $lte: end }, isCompleted: false }).lean(),
      Note.find({ user: req.user.sub, deadline: { $ne: null } }).lean(),
      Reminder.find({ user: req.user.sub, dateKey: { $lte: end } }).lean()
    ]);
    const events = [
      ...tasks.map((task) => ({ type: 'task', id: task._id, title: task.title, dateKey: task.dateKey })),
      ...notes
        .map((note) => ({ type: 'note', id: note._id, title: note.title, dateKey: dayKey(note.deadline, timezone) }))
        .filter((note) => note.dateKey >= start && note.dateKey <= end)
      ,
      ...reminderSeries.flatMap((reminder) => occurrenceDates(reminder, start, end)
        .map((dateKey) => ({ reminder, dateKey })))
        .map(({ reminder, dateKey }) => occurrenceView(reminder, dateKey))
        .filter((reminder) => !['completed', 'dismissed', 'missed'].includes(reminder.status))
        .map((reminder) => ({ type: 'reminder', id: reminder._id, title: reminder.title, dateKey: reminder.occurrenceDateKey, time: reminder.time }))
    ].sort((left, right) => left.dateKey.localeCompare(right.dateKey));
    return res.json({ days, events });
  } catch (error) {
    return next(error);
  }
}

import mongoose from 'mongoose';
import Reminder from '../models/Reminder.js';
import User from '../models/User.js';
import { isValidDayKey, todayKey } from '../utils/dateUtils.js';
import { createReminderSchema, updateReminderSchema, updateReminderStatusSchema } from '../validators/reminder.js';
import { baseReminderId, dateRange, occurrenceDates, occurrenceView } from '../utils/reminderRecurrence.js';

const parse = (schema, value) => {
  const result = schema.safeParse(value);
  if (!result.success) {
    const error = new Error(result.error.issues[0].message);
    error.status = 400;
    throw error;
  }
  return result.data;
};

const requireId = (value) => {
  const id = baseReminderId(value);
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error('Invalid reminder id');
    error.status = 400;
    throw error;
  }
  return id;
};

const userTimezone = async (userId) => {
  const user = await User.findById(userId).select('settings.timezone').lean();
  return user?.settings?.timezone || 'Asia/Kolkata';
};

const visibleOccurrences = (reminder, from, through) => occurrenceDates(reminder, from, through)
  .map((dateKey) => occurrenceView(reminder, dateKey))
  .filter((item) => ['upcoming', 'snoozed', 'triggered'].includes(item.status));

export async function getUpcoming(req, res, next) {
  try {
    const timezone = await userTimezone(req.user.sub);
    const range = dateRange(todayKey(timezone), 366);
    const series = await Reminder.find({ user: req.user.sub }).sort({ dateKey: 1, time: 1, createdAt: 1 }).lean();
    const reminders = series.flatMap((reminder) => visibleOccurrences(reminder, range.from, range.through))
      .sort((a, b) => `${a.dateKey}T${a.time}`.localeCompare(`${b.dateKey}T${b.time}`));
    return res.json({ reminders });
  } catch (error) {
    return next(error);
  }
}

export async function getByDate(req, res, next) {
  try {
    if (!isValidDayKey(req.params.dateKey)) {
      const error = new Error('Invalid date key');
      error.status = 400;
      throw error;
    }
    const series = await Reminder.find({ user: req.user.sub, dateKey: { $lte: req.params.dateKey } }).lean();
    const reminders = series.flatMap((reminder) => occurrenceDates(reminder, req.params.dateKey, req.params.dateKey)
      .map((dateKey) => occurrenceView(reminder, dateKey)));
    return res.json({ dateKey: req.params.dateKey, reminders });
  } catch (error) {
    return next(error);
  }
}

export async function createReminder(req, res, next) {
  try {
    const data = parse(createReminderSchema, req.body);
    const reminder = await Reminder.create({ ...data, user: req.user.sub });
    return res.status(201).json({ reminder: occurrenceView(reminder.toObject(), reminder.dateKey) });
  } catch (error) {
    return next(error);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const id = requireId(req.params.id);
    const data = parse(updateReminderStatusSchema, req.body);
    const reminder = await Reminder.findOne({ _id: id, user: req.user.sub });
    if (!reminder) return res.status(404).json({ message: 'Reminder not found' });
    const occurrenceDateKey = data.occurrenceDateKey || reminder.dateKey;
    if (!occurrenceDates(reminder, occurrenceDateKey, occurrenceDateKey).includes(occurrenceDateKey)) {
      return res.status(400).json({ message: 'Invalid reminder occurrence' });
    }
    if (reminder.repeat === 'none' && occurrenceDateKey === reminder.dateKey) reminder.status = data.status;
    else {
      const existing = reminder.occurrenceStates.find((item) => item.dateKey === occurrenceDateKey);
      if (existing) {
        existing.status = data.status;
        existing.snoozedUntil = data.status === 'snoozed' ? new Date(Date.now() + 5 * 60 * 1000) : undefined;
      } else {
        reminder.occurrenceStates.push({
          dateKey: occurrenceDateKey,
          status: data.status,
          snoozedUntil: data.status === 'snoozed' ? new Date(Date.now() + 5 * 60 * 1000) : undefined
        });
      }
    }
    await reminder.save();
    return res.json({ reminder: occurrenceView(reminder.toObject(), occurrenceDateKey) });
  } catch (error) {
    return next(error);
  }
}

export async function updateReminder(req, res, next) {
  try {
    const id = requireId(req.params.id);
    const data = parse(updateReminderSchema, req.body);
    const reminder = await Reminder.findOneAndUpdate(
      { _id: id, user: req.user.sub },
      { $set: data },
      { new: true, runValidators: true }
    ).lean();
    if (!reminder) return res.status(404).json({ message: 'Reminder not found' });
    return res.json({ reminder: occurrenceView(reminder, reminder.dateKey) });
  } catch (error) {
    return next(error);
  }
}

export async function deleteReminder(req, res, next) {
  try {
    const id = requireId(req.params.id);
    const reminder = await Reminder.findOneAndDelete({ _id: id, user: req.user.sub });
    if (!reminder) return res.status(404).json({ message: 'Reminder not found' });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

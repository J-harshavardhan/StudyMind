import mongoose from 'mongoose';
import Note from '../models/Note.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { addDays, isValidDayKey, todayKey } from '../utils/dateUtils.js';
import { createTaskSchema, updateTaskSchema } from '../validators/task.js';

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
  if (!mongoose.isValidObjectId(value)) {
    const error = new Error('Invalid task id');
    error.status = 400;
    throw error;
  }
};

const userTimezone = async (userId) => {
  const user = await User.findById(userId).select('settings.timezone').lean();
  return user?.settings?.timezone || 'UTC';
};

const validateNote = async (noteId, userId) => {
  if (noteId === undefined || noteId === null) return;
  if (!mongoose.isValidObjectId(noteId) || !(await Note.exists({ _id: noteId, user: userId }))) {
    const error = new Error('Note does not belong to this user');
    error.status = 400;
    throw error;
  }
};

export async function getToday(req, res, next) {
  try {
    const timezone = await userTimezone(req.user.sub);
    const dateKey = todayKey(timezone);
    const moved = await Task.updateMany(
      { user: req.user.sub, dateKey: { $lt: dateKey }, isCompleted: false },
      { $set: { dateKey } }
    );
    const tasks = await Task.find({ user: req.user.sub, dateKey }).sort({ isCompleted: 1, createdAt: 1 });
    return res.json({ dateKey, tasks, movedCount: moved.modifiedCount });
  } catch (error) {
    return next(error);
  }
}

export async function getRange(req, res, next) {
  try {
    const { from, to } = req.query;
    if (!isValidDayKey(from) || !isValidDayKey(to) || from > to) {
      const error = new Error('Invalid date range');
      error.status = 400;
      throw error;
    }
    let totalDays = 1;
    for (let cursor = from; cursor !== to; cursor = addDays(cursor, 1)) totalDays += 1;
    if (totalDays > 62) {
      const error = new Error('Date range cannot exceed 62 days');
      error.status = 400;
      throw error;
    }
    const tasks = await Task.find({ user: req.user.sub, dateKey: { $gte: from, $lte: to } }).sort({ dateKey: 1, createdAt: 1 });
    return res.json({ from, to, tasks });
  } catch (error) {
    return next(error);
  }
}

export async function createTask(req, res, next) {
  try {
    const data = parse(createTaskSchema, req.body);
    if (!data.dateKey) {
      const error = new Error('dateKey is required');
      error.status = 400;
      throw error;
    }
    await validateNote(data.note, req.user.sub);
    const task = await Task.create({ ...data, user: req.user.sub });
    return res.status(201).json({ task });
  } catch (error) {
    return next(error);
  }
}

export async function updateTask(req, res, next) {
  try {
    requireId(req.params.id);
    const data = parse(updateTaskSchema, req.body);
    await validateNote(data.note, req.user.sub);
    const task = await Task.findOneAndUpdate({ _id: req.params.id, user: req.user.sub }, data, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    return res.json({ task });
  } catch (error) {
    return next(error);
  }
}

export async function toggleComplete(req, res, next) {
  try {
    requireId(req.params.id);
    const task = await Task.findOne({ _id: req.params.id, user: req.user.sub });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    task.isCompleted = !task.isCompleted;
    task.completedAt = task.isCompleted ? new Date() : null;
    await task.save();
    return res.json({ task });
  } catch (error) {
    return next(error);
  }
}

export async function deleteTask(req, res, next) {
  try {
    requireId(req.params.id);
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.sub });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

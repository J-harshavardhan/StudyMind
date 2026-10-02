import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Note from '../models/Note.js';
import { createNoteSchema, noteQuerySchema, updateNoteSchema } from '../validators/note.js';

const parse = (schema, data) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const error = new Error(result.error.issues[0].message);
    error.status = 400;
    throw error;
  }
  return result.data;
};

const requireObjectId = (id, label = 'note') => {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error(`Invalid ${label} id`);
    error.status = 400;
    throw error;
  }
};

const validateCategory = async (categoryId, userId) => {
  if (categoryId === undefined || categoryId === null) return;
  requireObjectId(categoryId, 'category');
  if (!(await Category.exists({ _id: categoryId, user: userId }))) {
    const error = new Error('Category does not belong to this user');
    error.status = 400;
    throw error;
  }
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
const toListNote = (note) => {
  const value = note.toObject();
  delete value.content;
  const content = note.content || '';
  return { ...value, excerpt: content.slice(0, 200) };
};

export const listNotes = async (req, res, next) => {
  try {
    const query = parse(noteQuerySchema, req.query);
    const filter = { user: req.user.sub };
    if (query.category) {
      await validateCategory(query.category, req.user.sub);
      filter.category = query.category;
    }
    if (query.tag) filter.tags = query.tag;
    if (query.pinned !== undefined) filter.isPinned = query.pinned;
    if (query.hasDeadline === true) filter.deadline = { $ne: null };
    if (query.hasDeadline === false) filter.deadline = null;
    if (query.q) {
      const expression = new RegExp(escapeRegex(query.q), 'i');
      filter.$or = [{ title: expression }, { content: expression }, { tags: expression }];
    }

    const sort = query.sort === 'deadline'
      ? { isPinned: -1, deadline: 1, updatedAt: -1 }
      : { isPinned: -1, updatedAt: -1 };
    const skip = (query.page - 1) * query.limit;
    const [notes, total] = await Promise.all([
      Note.find(filter).sort(sort).skip(skip).limit(query.limit).populate('category', 'name color icon'),
      Note.countDocuments(filter)
    ]);

    return res.json({
      notes: notes.map(toListNote),
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit)
    });
  } catch (error) {
    return next(error);
  }
};

export const createNote = async (req, res, next) => {
  try {
    const data = parse(createNoteSchema, req.body);
    await validateCategory(data.category, req.user.sub);
    const note = await Note.create({ ...data, user: req.user.sub });
    return res.status(201).json({ note });
  } catch (error) {
    return next(error);
  }
};

export const getNote = async (req, res, next) => {
  try {
    requireObjectId(req.params.id);
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user.sub },
      { $set: { lastViewedAt: new Date() } },
      { new: true }
    ).populate('category', 'name color icon');
    if (!note) return res.status(404).json({ message: 'Note not found' });
    return res.json({ note });
  } catch (error) {
    return next(error);
  }
};

export const updateNote = async (req, res, next) => {
  try {
    requireObjectId(req.params.id);
    const data = parse(updateNoteSchema, req.body);
    await validateCategory(data.category, req.user.sub);
    const note = await Note.findOne({ _id: req.params.id, user: req.user.sub });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    Object.assign(note, data);
    await note.save();
    await note.populate('category', 'name color icon');
    return res.json({ note });
  } catch (error) {
    return next(error);
  }
};

export const togglePin = async (req, res, next) => {
  try {
    requireObjectId(req.params.id);
    const note = await Note.findOne({ _id: req.params.id, user: req.user.sub });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    note.isPinned = !note.isPinned;
    await note.save();
    return res.json({ note });
  } catch (error) {
    return next(error);
  }
};

export const deleteNote = async (req, res, next) => {
  try {
    requireObjectId(req.params.id);
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user.sub });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

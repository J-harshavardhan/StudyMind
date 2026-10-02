import mongoose from 'mongoose';
import Category from '../models/Category.js';
import { createCategorySchema, updateCategorySchema } from '../validators/category.js';

const parse = (schema, data) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const error = new Error(result.error.issues[0].message);
    error.status = 400;
    throw error;
  }
  return result.data;
};

const requireObjectId = (id) => {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error('Invalid category id');
    error.status = 400;
    throw error;
  }
};

export const listCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ user: req.user.sub }).sort({ name: 1 });
    return res.json({ categories });
  } catch (error) {
    return next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const data = parse(createCategorySchema, req.body);
    const category = await Category.create({ ...data, user: req.user.sub });
    return res.status(201).json({ category });
  } catch (error) {
    return next(error);
  }
};

export const getCategory = async (req, res, next) => {
  try {
    requireObjectId(req.params.id);
    const category = await Category.findOne({ _id: req.params.id, user: req.user.sub });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    return res.json({ category });
  } catch (error) {
    return next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    requireObjectId(req.params.id);
    const data = parse(updateCategorySchema, req.body);
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, user: req.user.sub },
      data,
      { new: true, runValidators: true }
    );
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    return res.json({ category });
  } catch (error) {
    return next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    requireObjectId(req.params.id);
    const category = await Category.findOneAndDelete({ _id: req.params.id, user: req.user.sub });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const Note = mongoose.models.Note;
    if (Note) {
      await Note.updateMany({ user: req.user.sub, category: category._id }, { $set: { category: null } });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

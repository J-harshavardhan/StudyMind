import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    timezone: { type: String, default: 'Asia/Kolkata', trim: true },
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    dailyFocusGoalMinutes: { type: Number, default: 30, min: 0, max: 600 }
  },
  { _id: false }
);

const streakSchema = new mongoose.Schema(
  {
    current: { type: Number, default: 0, min: 0 },
    longest: { type: Number, default: 0, min: 0 },
    lastActivityDate: { type: String, default: null, match: /^\d{4}-\d{2}-\d{2}$/ }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    sessionVersion: { type: Number, default: 0, min: 0 },
    settings: { type: settingsSchema, default: () => ({}) },
    streak: { type: streakSchema, default: () => ({}) }
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);

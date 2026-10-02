import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    dateKey: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/u },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    note: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', default: null },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    source: { type: String, enum: ['manual', 'study-plan', 'pomodoro'], default: 'manual' }
  },
  { timestamps: true }
);

taskSchema.index({ user: 1, dateKey: 1, isCompleted: 1 });
taskSchema.index({ user: 1, note: 1 });

export default mongoose.model('Task', taskSchema);

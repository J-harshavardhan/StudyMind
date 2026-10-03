import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    dateKey: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/u },
    time: { type: String, required: true, match: /^(?:[01]\d|2[0-3]):[0-5]\d$/u },
    timezone: { type: String, required: true, default: 'Asia/Kolkata', trim: true },
    duration: { type: Number, required: true, min: 0, max: 1440, default: 0 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    repeat: { type: String, enum: ['none', 'daily', 'weekdays', 'weekly'], default: 'none' },
    reminderOffset: { type: Number, enum: [0, 5, 10, 15], default: 0 },
    ringtoneType: { type: String, enum: ['default', 'custom'], default: 'default' },
    status: { type: String, enum: ['upcoming', 'triggered', 'snoozed', 'completed', 'dismissed', 'missed'], default: 'upcoming' },
    occurrenceStates: [{
      dateKey: { type: String, match: /^\d{4}-\d{2}-\d{2}$/u },
      status: { type: String, enum: ['upcoming', 'triggered', 'snoozed', 'completed', 'dismissed', 'missed'] },
      snoozedUntil: { type: Date }
    }]
  },
  { timestamps: true }
);

reminderSchema.index({ user: 1, dateKey: 1, time: 1 });
reminderSchema.index({ user: 1, status: 1, dateKey: 1 });

export default mongoose.model('Reminder', reminderSchema);

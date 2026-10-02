import mongoose from 'mongoose';

const summarySchema = new mongoose.Schema(
  {
    text: { type: String, default: '' },
    generatedAt: { type: Date, default: null },
    model: { type: String, default: '' }
  },
  { _id: false }
);

const noteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, default: '', maxlength: 100000 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    tags: {
      type: [{ type: String, trim: true, lowercase: true, maxlength: 30 }],
      default: [],
      validate: { validator: (tags) => tags.length <= 10, message: 'A note can have at most 10 tags' }
    },
    isPinned: { type: Boolean, default: false },
    deadline: { type: Date, default: null },
    summary: { type: summarySchema, default: () => ({}) },
    wordCount: { type: Number, default: 0, min: 0 },
    lastViewedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

noteSchema.index({ user: 1, isPinned: -1, updatedAt: -1 });
noteSchema.index({ user: 1, category: 1 });
noteSchema.index({ user: 1, tags: 1 });
noteSchema.index({ user: 1, deadline: 1 }, { sparse: true });

noteSchema.pre('save', function calculateWordCount(next) {
  const words = this.content.trim().match(/\S+/gu);
  this.wordCount = words ? words.length : 0;
  next();
});

export default mongoose.model('Note', noteSchema);

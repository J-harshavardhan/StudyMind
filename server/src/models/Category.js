import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 40 },
    color: {
      type: String,
      required: true,
      match: /^#[0-9A-Fa-f]{6}$/
    },
    icon: { type: String, required: true }
  },
  { timestamps: true }
);

categorySchema.index({ user: 1, name: 1 }, { unique: true });

export default mongoose.model('Category', categorySchema);

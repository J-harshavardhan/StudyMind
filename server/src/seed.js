import 'dotenv/config';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import { connectDb, closeDb } from './utils/db.js';

const force = process.argv.includes('--force');
const mongoUri = process.env.MONGO_URI || '';
const isLocalMongo = /(?:localhost|127\.0\.0\.1)/i.test(mongoUri);

if (process.env.SEED !== 'true' || (!isLocalMongo && !force)) {
  console.error('Refusing to seed: use SEED=true with a localhost MONGO_URI, or add --force explicitly');
  process.exit(1);
}
await connectDb();
await User.updateOne(
  { email: 'demo@studymind.local' },
  { $setOnInsert: { name: 'Demo Learner', email: 'demo@studymind.local', passwordHash: await bcrypt.hash('ChangeMe123!', 12) } },
  { upsert: true }
);
console.log('Seed complete');
await closeDb();

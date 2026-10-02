process.env.NODE_ENV = 'test';
process.env.USE_MEMORY_DB = 'true';
process.env.JWT_SECRET = 'a-very-long-test-secret-1234567890';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.AUTH_RATE_LIMIT_MAX = '100';
process.env.GENERAL_RATE_LIMIT_MAX = '1000';

const { default: app } = await import('../src/app.js');
const test = (await import('node:test')).default;
const assert = (await import('node:assert/strict')).default;
const request = (await import('supertest')).default;
const { default: User } = await import('../src/models/User.js');
const { default: Note } = await import('../src/models/Note.js');
const { default: Task } = await import('../src/models/Task.js');
const { connectDb, closeDb } = await import('../src/utils/db.js');
const { addDays, todayKey } = await import('../src/utils/dateUtils.js');

test.before(async () => connectDb());
test.after(async () => {
  await Task.deleteMany({});
  await Note.deleteMany({});
  await User.deleteMany({});
  await closeDb();
});

const userToken = async (email) => {
  const response = await request(app).post('/api/auth/register').send({
    name: 'Calendar Tester',
    email,
    password: 'StrongPass123'
  });
  return response.body.token;
};
test('calendar requires authentication', async () => {
  const response = await request(app).get('/api/calendar/month?month=2025-02');
  assert.equal(response.status, 401);
});
test('calendar rejects invalid months', async () => {
  const response = await request(app).get('/api/calendar/month?month=2025-13');
  assert.equal(response.status, 401);
});

test('month returns day buckets', async () => {
  const token = await userToken('calendar-month@example.com');
  await request(app).post('/api/tasks').set('Authorization', `Bearer ${token}`).send({ title: 'Task', dateKey: '2026-02-10' });
  const response = await request(app).get('/api/calendar/month?year=2026&month=2').set('Authorization', `Bearer ${token}`);
  assert.equal(response.status, 200);
  const bucket = response.body.days.find((day) => day.dateKey === '2026-02-10');
  assert.equal(bucket.taskCount, 1);
  assert.equal(bucket.completedCount, 0);
});

test('upcoming returns events in date order', async () => {
  const token = await userToken('calendar-upcoming@example.com');
  const start = todayKey('UTC');
  await request(app).post('/api/tasks').set('Authorization', `Bearer ${token}`).send({ title: 'Later', dateKey: addDays(start, 2) });
  await request(app).post('/api/tasks').set('Authorization', `Bearer ${token}`).send({ title: 'Sooner', dateKey: addDays(start, 1) });
  const response = await request(app).get('/api/calendar/upcoming?days=60').set('Authorization', `Bearer ${token}`);
  assert.equal(response.status, 200);
  assert.deepEqual(response.body.events.map((event) => event.title), ['Sooner', 'Later']);
});

test('note deadlines use the user timezone for month buckets', async () => {
  const token = await userToken('calendar-timezone@example.com');
  const user = await User.findOne({ email: 'calendar-timezone@example.com' });
  user.settings.timezone = 'Asia/Kolkata';
  await user.save();
  await request(app).post('/api/notes').set('Authorization', `Bearer ${token}`).send({
    title: 'Boundary note',
    content: '',
    deadline: '2026-01-31T23:30:00.000Z'
  });
  const response = await request(app).get('/api/calendar/month?year=2026&month=2').set('Authorization', `Bearer ${token}`);
  const bucket = response.body.days.find((day) => day.dateKey === '2026-02-01');
  assert.equal(bucket.noteDeadlines.length, 1);
});

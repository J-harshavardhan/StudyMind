process.env.NODE_ENV = 'test';
process.env.USE_MEMORY_DB = 'true';
process.env.JWT_SECRET = 'a-very-long-test-secret-1234567890';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.AUTH_RATE_LIMIT_MAX = '100';
process.env.GENERAL_RATE_LIMIT_MAX = '1000';

const { default: app } = await import('../src/app.js');
const { default: User } = await import('../src/models/User.js');
const { default: Reminder } = await import('../src/models/Reminder.js');
const { connectDb, closeDb } = await import('../src/utils/db.js');
const test = (await import('node:test')).default;
const assert = (await import('node:assert/strict')).default;
const request = (await import('supertest')).default;

test.before(async () => connectDb());
test.after(async () => {
  await User.deleteMany({});
  await Reminder.deleteMany({});
  await closeDb();
});

const createUser = async (email) => {
  const response = await request(app).post('/api/auth/register').send({
    name: 'Reminder Tester',
    email,
    password: 'StrongPass123'
  });
  return response.headers['set-cookie'][0].split(';')[0];
};

const reminderPayload = {
  title: 'Study session',
  dateKey: '2099-01-02',
  time: '09:30',
  duration: 45,
  description: 'Review flashcards',
  repeat: 'weekly',
  reminderOffset: 10,
  ringtoneType: 'default'
};

test('reminders require authentication', async () => {
  const response = await request(app).get('/api/reminders/upcoming');
  assert.equal(response.status, 401);
});

test('creates reminders with Asia/Kolkata and returns only the owner records', async () => {
  const owner = await createUser('reminder-owner@example.com');
  const other = await createUser('reminder-other@example.com');
  const created = await request(app).post('/api/reminders')
    .set('Origin', process.env.CLIENT_ORIGIN).set('Cookie', owner).send(reminderPayload);
  assert.equal(created.status, 201);
  assert.equal(created.body.reminder.timezone, 'Asia/Kolkata');
  assert.equal(created.body.reminder.status, 'upcoming');

  await request(app).post('/api/reminders')
    .set('Origin', process.env.CLIENT_ORIGIN).set('Cookie', other).send({ ...reminderPayload, title: 'Other' });
  const response = await request(app).get('/api/reminders/date/2099-01-02')
    .set('Origin', process.env.CLIENT_ORIGIN).set('Cookie', owner);
  assert.equal(response.status, 200);
  assert.deepEqual(response.body.reminders.map((reminder) => reminder.title), ['Study session']);
});

test('rejects invalid reminder values', async () => {
  const token = await createUser('reminder-validation@example.com');
  const response = await request(app).post('/api/reminders')
    .set('Origin', process.env.CLIENT_ORIGIN).set('Cookie', token)
    .send({ ...reminderPayload, time: '25:00', reminderOffset: 7 });
  assert.equal(response.status, 400);
});

test('updates and deletes only an owned reminder', async () => {
  const owner = await createUser('reminder-status-owner@example.com');
  const other = await createUser('reminder-status-other@example.com');
  const created = await request(app).post('/api/reminders')
    .set('Origin', process.env.CLIENT_ORIGIN).set('Cookie', owner).send(reminderPayload);
  const id = created.body.reminder._id;

  const denied = await request(app).patch(`/api/reminders/${id}/status`)
    .set('Origin', process.env.CLIENT_ORIGIN).set('Cookie', other).send({ status: 'completed' });
  assert.equal(denied.status, 404);
  const updated = await request(app).patch(`/api/reminders/${id}/status`)
    .set('Origin', process.env.CLIENT_ORIGIN).set('Cookie', owner).send({ status: 'snoozed' });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.reminder.status, 'snoozed');

  const deleted = await request(app).delete(`/api/reminders/${id}`)
    .set('Origin', process.env.CLIENT_ORIGIN).set('Cookie', owner);
  assert.equal(deleted.status, 204);
});

test('returns virtual recurring occurrences and scopes status to one occurrence', async () => {
  const owner = await createUser('reminder-recurrence@example.com');
  const created = await request(app).post('/api/reminders')
    .set('Origin', process.env.CLIENT_ORIGIN).set('Cookie', owner)
    .send({ ...reminderPayload, dateKey: '2099-01-05', repeat: 'daily' });
  assert.equal(created.status, 201);

  const dateResponse = await request(app).get('/api/reminders/date/2099-01-07')
    .set('Origin', process.env.CLIENT_ORIGIN).set('Cookie', owner);
  assert.equal(dateResponse.status, 200);
  assert.equal(dateResponse.body.reminders.length, 1);
  assert.equal(dateResponse.body.reminders[0].occurrenceDateKey, '2099-01-07');
  assert.equal(dateResponse.body.reminders[0].seriesId, created.body.reminder.seriesId);

  const updated = await request(app).patch(`/api/reminders/${created.body.reminder.seriesId}:2099-01-07/status`)
    .set('Origin', process.env.CLIENT_ORIGIN).set('Cookie', owner)
    .send({ status: 'completed', occurrenceDateKey: '2099-01-07' });
  assert.equal(updated.status, 200);

  const nextDate = await request(app).get('/api/reminders/date/2099-01-08')
    .set('Origin', process.env.CLIENT_ORIGIN).set('Cookie', owner);
  assert.equal(nextDate.body.reminders[0].status, 'upcoming');
});

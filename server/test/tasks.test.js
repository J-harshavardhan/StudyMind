process.env.NODE_ENV = 'test';
process.env.USE_MEMORY_DB = 'true';
process.env.JWT_SECRET = 'a-very-long-test-secret-1234567890';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.AUTH_RATE_LIMIT_MAX = '100';
process.env.GENERAL_RATE_LIMIT_MAX = '1000';

const { default: app } = await import('../src/app.js');
const { default: User } = await import('../src/models/User.js');
const { default: Task } = await import('../src/models/Task.js');
const { connectDb, closeDb } = await import('../src/utils/db.js');
const test = (await import('node:test')).default;
const assert = (await import('node:assert/strict')).default;
const request = (await import('supertest')).default;

test.before(async () => connectDb());
test.after(async () => { await User.deleteMany({}); await Task.deleteMany({}); await closeDb(); });
test('tasks require authentication', async () => {
  const response = await request(app).get('/api/tasks/today');
  assert.equal(response.status, 401);
});
test('tasks are created and scoped to their owner', async () => {
  const registration = await request(app).post('/api/auth/register').send({
    name: 'Task User', email: 'task-user@example.com', password: 'StrongPass123'
  });

  test('defaults a missing dateKey to the user timezone today', async () => {
    const token = await createUser('task-default-date@example.com');
    const response = await createTask(token, { title: 'Default date' });
    assert.equal(response.status, 201);
    assert.equal(response.body.task.dateKey, new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date()));
  });
  const user = await User.findOne({ email: 'task-user@example.com' });
  const token = registration.headers['set-cookie'][0].split(';')[0];
  const response = await request(app).post('/api/tasks').set('Origin', 'http://localhost:5173').set('Cookie', token).send({ title: 'Read', dayKey: '2025-02-01' });
  assert.equal(response.status, 201);
  assert.equal(response.body.task.user, user._id.toString());
});

const createUser = async (email) => {
  const response = await request(app).post('/api/auth/register').send({
    name: 'Task Tester',
    email,
    password: 'StrongPass123'
  });
  return response.headers['set-cookie'][0].split(';')[0];
};

const createTask = (token, payload) => request(app)
  .post('/api/tasks')
  .set('Origin', 'http://localhost:5173').set('Cookie', token)
  .send(payload);

test('rejects invalid task data', async () => {
  const token = await createUser('task-validation@example.com');
  const response = await createTask(token, { title: '', dateKey: '2026-02-30' });
  assert.equal(response.status, 400);
});

test('today returns only own tasks', async () => {
  const owner = await createUser('task-today-owner@example.com');
  const other = await createUser('task-today-other@example.com');
  await createTask(owner, { title: 'Owner task', dateKey: '2026-01-01' });
  await createTask(other, { title: 'Other task', dateKey: '2026-01-01' });
  const response = await request(app).get('/api/tasks/today').set('Origin', 'http://localhost:5173').set('Cookie', owner);
  assert.equal(response.status, 200);
  assert.equal(response.body.tasks.every((task) => task.title === 'Owner task'), true);
});

test('today rolls over incomplete tasks but leaves completed tasks', async () => {
  const token = await createUser('task-rollover@example.com');
  const incomplete = await createTask(token, { title: 'Move me', dateKey: '2020-01-01' });
  const completed = await createTask(token, { title: 'Leave me', dateKey: '2020-01-01' });
  await request(app).patch(`/api/tasks/${completed.body.task._id}/complete`).set('Origin', 'http://localhost:5173').set('Cookie', token);
  const response = await request(app).get('/api/tasks/today').set('Origin', 'http://localhost:5173').set('Cookie', token);
  assert.equal(response.body.movedCount, 1);
  assert.equal(response.body.tasks.some((task) => task._id === incomplete.body.task._id), true);
  const retained = await Task.findById(completed.body.task._id);
  assert.equal(retained.dateKey, '2020-01-01');
});

test('toggles completion on and off', async () => {
  const token = await createUser('task-toggle@example.com');
  const created = await createTask(token, { title: 'Toggle', dateKey: '2026-01-01' });
  const completed = await request(app).patch(`/api/tasks/${created.body.task._id}/complete`).set('Origin', 'http://localhost:5173').set('Cookie', token);
  const uncompleted = await request(app).patch(`/api/tasks/${created.body.task._id}/complete`).set('Origin', 'http://localhost:5173').set('Cookie', token);
  assert.equal(completed.body.task.isCompleted, true);
  assert.ok(completed.body.task.completedAt);
  assert.equal(uncompleted.body.task.isCompleted, false);
  assert.equal(uncompleted.body.task.completedAt, null);
});

test('updates a task', async () => {
  const token = await createUser('task-update@example.com');
  const created = await createTask(token, { title: 'Old', dateKey: '2026-01-01' });
  const response = await request(app).patch(`/api/tasks/${created.body.task._id}`).set('Origin', 'http://localhost:5173').set('Cookie', token).send({ title: 'New', dateKey: '2026-01-02', priority: 'high' });
  assert.equal(response.status, 200);
  assert.equal(response.body.task.title, 'New');
  assert.equal(response.body.task.priority, 'high');
});

test('deletes a task', async () => {
  const token = await createUser('task-delete@example.com');
  const created = await createTask(token, { title: 'Delete', dateKey: '2026-01-01' });
  const response = await request(app).delete(`/api/tasks/${created.body.task._id}`).set('Origin', 'http://localhost:5173').set('Cookie', token);
  assert.equal(response.status, 204);
});

test('another user gets 404 for a task', async () => {
  const owner = await createUser('task-404-owner@example.com');
  const other = await createUser('task-404-other@example.com');
  const created = await createTask(owner, { title: 'Private', dateKey: '2026-01-01' });
  const response = await request(app).patch(`/api/tasks/${created.body.task._id}`).set('Origin', 'http://localhost:5173').set('Cookie', other).send({ title: 'Nope' });
  assert.equal(response.status, 404);
});

test('rejects a note belonging to another user', async () => {
  const owner = await createUser('task-note-owner@example.com');
  const other = await createUser('task-note-other@example.com');
  const noteResponse = await request(app).post('/api/notes').set('Origin', 'http://localhost:5173').set('Cookie', owner).send({ title: 'Private note', content: '' });
  const response = await createTask(other, { title: 'Bad note', dateKey: '2026-01-01', note: noteResponse.body.note._id });
  assert.equal(response.status, 400);
});

test('rejects ranges longer than 62 days', async () => {
  const token = await createUser('task-range@example.com');
  const response = await request(app).get('/api/tasks/range?from=2026-01-01&to=2026-03-10').set('Origin', 'http://localhost:5173').set('Cookie', token);
  assert.equal(response.status, 400);
});

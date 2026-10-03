process.env.NODE_ENV = 'test';
process.env.USE_MEMORY_DB = 'true';
process.env.JWT_SECRET = 'a-very-long-test-secret-1234567890';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.AUTH_RATE_LIMIT_MAX = '100';
process.env.GENERAL_RATE_LIMIT_MAX = '1000';

const { default: app } = await import('../src/app.js');
const { default: User } = await import('../src/models/User.js');
const { default: Note } = await import('../src/models/Note.js');
const { default: Category } = await import('../src/models/Category.js');
const { connectDb, closeDb } = await import('../src/utils/db.js');
const test = (await import('node:test')).default;
const assert = (await import('node:assert/strict')).default;
const request = (await import('supertest')).default;

const register = async (email) => {
  const response = await request(app).post('/api/auth/register')
    .send({ name: 'Notes User', email, password: 'StrongPass123' });
  assert.equal(response.status, 201);
  return response.headers['set-cookie'][0].split(';')[0];
};

const note = (overrides = {}) => ({
  title: 'A useful note',
  content: 'one two three four',
  ...overrides
});

const createNote = (token, overrides = {}) => request(app).post('/api/notes')
  .set('Origin', 'http://localhost:5173').set('Cookie', token).send(note(overrides));

test.before(async () => connectDb());
test.after(async () => {
  await Note.deleteMany({});
  await Category.deleteMany({});
  await User.deleteMany({});
  await closeDb();
});
test.beforeEach(async () => {
  await Note.deleteMany({});
  await Category.deleteMany({});
  await User.deleteMany({});
});

test('creates notes and calculates wordCount', async () => {
  const token = await register('notes-create@example.com');
  const response = await createNote(token, { content: '  one   two\nthree  ' });
  assert.equal(response.status, 201);
  assert.equal(response.body.note.wordCount, 3);
});

test('requires authentication and validates note ids', async () => {
  assert.equal((await request(app).get('/api/notes')).status, 401);
  const token = await register('notes-id@example.com');
  assert.equal((await request(app).get('/api/notes/not-an-id')
    .set('Origin', 'http://localhost:5173').set('Cookie', token)).status, 400);
});

test('scopes notes to their owner', async () => {
  const owner = await register('notes-owner@example.com');
  const other = await register('notes-other@example.com');
  const created = await createNote(owner);
  const response = await request(app).get(`/api/notes/${created.body.note._id}`)
    .set('Origin', 'http://localhost:5173').set('Cookie', other);
  assert.equal(response.status, 404);
});

test('supports category ownership, filtering, search, pagination and sorting', async () => {
  const token = await register('notes-filter@example.com');
  const category = await request(app).post('/api/categories').set('Origin', 'http://localhost:5173').set('Cookie', token)
    .send({ name: 'Study', color: '#3366FF', icon: 'book' });
  await createNote(token, { title: 'Zeta', category: category.body.category._id });
  await createNote(token, { title: 'Alpha', content: 'searchable words' });
  const response = await request(app).get('/api/notes?q=searchable&page=1&limit=1')
    .set('Origin', 'http://localhost:5173').set('Cookie', token);
  assert.equal(response.status, 200);
  assert.equal(response.body.notes.length, 1);
  assert.equal(response.body.notes[0].title, 'Alpha');
  assert.equal(response.body.notes[0].content, undefined);
  assert.match(response.body.notes[0].excerpt, /searchable/);
});

test('updates content and records lastViewedAt on get', async () => {
  const token = await register('notes-update@example.com');
  const created = await createNote(token);
  const updated = await request(app).patch(`/api/notes/${created.body.note._id}`)
    .set('Origin', 'http://localhost:5173').set('Cookie', token).send({ content: 'updated content' });
  assert.equal(updated.body.note.wordCount, 2);
  const fetched = await request(app).get(`/api/notes/${created.body.note._id}`)
    .set('Origin', 'http://localhost:5173').set('Cookie', token);
  assert.ok(fetched.body.note.lastViewedAt);
});

test('rejects another user category and deletes notes', async () => {
  const owner = await register('notes-category-owner@example.com');
  const other = await register('notes-category-other@example.com');
  const category = await request(app).post('/api/categories').set('Origin', 'http://localhost:5173').set('Cookie', owner)
    .send({ name: 'Private', color: '#3366FF', icon: 'book' });
  assert.equal((await createNote(other, { category: category.body.category._id })).status, 400);
  const created = await createNote(owner);
  assert.equal((await request(app).delete(`/api/notes/${created.body.note._id}`)
    .set('Origin', 'http://localhost:5173').set('Cookie', owner)).status, 204);
});

process.env.NODE_ENV = 'test';
process.env.USE_MEMORY_DB = 'true';
process.env.JWT_SECRET = 'a-very-long-test-secret-1234567890';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.PORT = '5000';
process.env.AUTH_RATE_LIMIT_MAX = '100';
process.env.GENERAL_RATE_LIMIT_MAX = '1000';

const { default: app } = await import('../src/app.js');
const { default: User } = await import('../src/models/User.js');
const { default: Category } = await import('../src/models/Category.js');
const { default: Note } = await import('../src/models/Note.js');
const { connectDb, closeDb } = await import('../src/utils/db.js');
const test = (await import('node:test')).default;
const assert = (await import('node:assert/strict')).default;
const request = (await import('supertest')).default;

const register = async (email) => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Category User', email, password: 'StrongPass123' });
  assert.equal(response.status, 201);
  return response.headers['set-cookie'][0].split(';')[0];
};

const categoryPayload = (overrides = {}) => ({
  name: 'Mathematics',
  color: '#3366FF',
  icon: 'calculator',
  ...overrides
});

const createCategory = (token, overrides = {}) => request(app)
  .post('/api/categories')
  .set('Origin', 'http://localhost:5173').set('Cookie', token)
  .send(categoryPayload(overrides));

test.before(async () => {
  await connectDb();
});

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

test('creates a category', async () => {
  const token = await register('category-create@example.com');
  const response = await createCategory(token);

  assert.equal(response.status, 201);
  assert.equal(response.body.category.name, 'Mathematics');
  assert.equal(response.body.category.color, '#3366FF');
  assert.equal(response.body.category.icon, 'calculator');
});

test('rejects duplicate category names for one user with 409', async () => {
  const token = await register('category-duplicate@example.com');
  await createCategory(token);
  const response = await createCategory(token);

  assert.equal(response.status, 409);
  assert.match(response.body.message, /category name already exists/i);
});

test('lists only the authenticated user categories', async () => {
  const firstToken = await register('category-list-a@example.com');
  const secondToken = await register('category-list-b@example.com');
  await createCategory(firstToken, { name: 'First User Category' });
  await createCategory(secondToken, { name: 'Second User Category' });

  const response = await request(app)
    .get('/api/categories')
    .set('Origin', 'http://localhost:5173').set('Cookie', firstToken);

  assert.equal(response.status, 200);
  assert.deepEqual(response.body.categories.map((category) => category.name), ['First User Category']);
});

test('another user cannot read, update, or delete a category', async () => {
  const ownerToken = await register('category-owner@example.com');
  const otherToken = await register('category-other@example.com');
  const created = await createCategory(ownerToken);
  const id = created.body.category._id;

  const read = await request(app).get(`/api/categories/${id}`).set('Origin', 'http://localhost:5173').set('Cookie', otherToken);
  const update = await request(app)
    .patch(`/api/categories/${id}`)
    .set('Origin', 'http://localhost:5173').set('Cookie', otherToken)
    .send({ name: 'Stolen' });
  const remove = await request(app).delete(`/api/categories/${id}`).set('Origin', 'http://localhost:5173').set('Cookie', otherToken);

  assert.equal(read.status, 404);
  assert.equal(update.status, 404);
  assert.equal(remove.status, 404);
});

test('updates a category', async () => {
  const token = await register('category-update@example.com');
  const created = await createCategory(token);
  const response = await request(app)
    .patch(`/api/categories/${created.body.category._id}`)
    .set('Origin', 'http://localhost:5173').set('Cookie', token)
    .send({ name: 'Updated', color: '#FF6633', icon: 'target' });

  assert.equal(response.status, 200);
  assert.equal(response.body.category.name, 'Updated');
  assert.equal(response.body.category.color, '#FF6633');
});

test('deletes a category', async () => {
  const token = await register('category-delete@example.com');
  const created = await createCategory(token);
  const response = await request(app)
    .delete(`/api/categories/${created.body.category._id}`)
    .set('Origin', 'http://localhost:5173').set('Cookie', token);

  assert.equal(response.status, 204);
  const getResponse = await request(app)
    .get(`/api/categories/${created.body.category._id}`)
    .set('Origin', 'http://localhost:5173').set('Cookie', token);
  assert.equal(getResponse.status, 404);
});

test('deleting a category nulls notes for that user only', async () => {
  const ownerToken = await register('category-note-owner@example.com');
  const otherToken = await register('category-note-other@example.com');
  const ownerCategory = await createCategory(ownerToken);
  const otherCategory = await createCategory(otherToken);

  const ownerNote = await request(app)
    .post('/api/notes')
    .set('Origin', 'http://localhost:5173').set('Cookie', ownerToken)
    .send({ title: 'Owner note', content: 'Owner content', category: ownerCategory.body.category._id });
  const otherNote = await request(app)
    .post('/api/notes')
    .set('Origin', 'http://localhost:5173').set('Cookie', otherToken)
    .send({ title: 'Other note', content: 'Other content', category: otherCategory.body.category._id });

  const response = await request(app)
    .delete(`/api/categories/${ownerCategory.body.category._id}`)
    .set('Origin', 'http://localhost:5173').set('Cookie', ownerToken);

  assert.equal(response.status, 204);
  const ownerRecord = await Note.findById(ownerNote.body.note._id);
  const otherRecord = await Note.findById(otherNote.body.note._id);
  assert.equal(ownerRecord.category, null);
  assert.equal(otherRecord.category.toString(), otherCategory.body.category._id);
});

test('rejects an invalid color with 400', async () => {
  const token = await register('category-color@example.com');
  const response = await createCategory(token, { color: 'blue' });

  assert.equal(response.status, 400);
});

test('requires authentication', async () => {
  const response = await request(app).get('/api/categories');
  assert.equal(response.status, 401);
});

test('rejects an invalid ObjectId with 400', async () => {
  const token = await register('category-id@example.com');
  const response = await request(app)
    .get('/api/categories/not-an-object-id')
    .set('Origin', 'http://localhost:5173').set('Cookie', token);

  assert.equal(response.status, 400);
});

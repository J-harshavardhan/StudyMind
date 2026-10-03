process.env.NODE_ENV = 'test';
process.env.USE_MEMORY_DB = 'true';
process.env.JWT_SECRET = 'a-very-long-test-secret-1234567890';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.PORT = '5000';
process.env.AUTH_RATE_LIMIT_MAX = '100';
process.env.GENERAL_RATE_LIMIT_MAX = '1000';

const { default: app } = await import('../src/app.js');
const { default: User } = await import('../src/models/User.js');
const { connectDb, closeDb } = await import('../src/utils/db.js');

const test = (await import('node:test')).default;
const assert = (await import('node:assert/strict')).default;
const request = (await import('supertest')).default;

const cookieFrom = (response) => response.headers['set-cookie'][0].split(';')[0];

const registerUser = async (payload = {}) => request(app).post('/api/auth/register').send({
  name: 'Alice Learner',
  email: 'alice@example.com',
  password: 'StrongPass123',
  ...payload
});

test.before(async () => {
  await connectDb();
});

test.after(async () => {
  await User.deleteMany({});
  await closeDb();
});

test.beforeEach(async () => {
  await User.deleteMany({});
});

test('health endpoint responds with ok true', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
});

test('protected profile route requires authentication', async () => {
  const res = await request(app).get('/api/auth/me');
  assert.equal(res.status, 401);
  assert.match(res.body.message, /Authentication required|Invalid or expired token/i);
});

test('register authenticates with an HttpOnly cookie and omits the token from JSON', async () => {
  const res = await registerUser();
  assert.equal(res.status, 201);
  assert.equal('token' in res.body, false);
  assert.match(res.headers['set-cookie'][0], /studymind_token=/);
  assert.match(res.headers['set-cookie'][0], /HttpOnly/i);

  const protectedResponse = await request(app).get('/api/auth/me').set('Origin', 'http://localhost:5173').set('Cookie', cookieFrom(res));
  assert.equal(protectedResponse.status, 200);
});

test('duplicate registration returns 409', async () => {
  await registerUser({ email: 'alice@example.com' });
  const res = await registerUser({ email: 'alice@example.com' });
  assert.equal(res.status, 409);
  assert.match(res.body.message, /already registered/i);
});

test('weak password is rejected', async () => {
  const res = await registerUser({ email: 'weak@example.com', password: 'short' });
  assert.equal(res.status, 400);
});

test('login authenticates with a cookie and omits the token from JSON', async () => {
  await registerUser({ email: 'alice@example.com' });
  const res = await request(app).post('/api/auth/login').send({
    email: 'alice@example.com',
    password: 'StrongPass123'
  });

  assert.equal(res.status, 200);
  assert.equal('token' in res.body, false);
  const protectedResponse = await request(app).get('/api/auth/me').set('Origin', 'http://localhost:5173').set('Cookie', cookieFrom(res));
  assert.equal(protectedResponse.status, 200);
});

test('wrong password is rejected', async () => {
  await registerUser({ email: 'wrong-password@example.com' });
  const res = await request(app).post('/api/auth/login').send({
    email: 'wrong-password@example.com',
    password: 'WrongPass123'
  });
  assert.equal(res.status, 401);
});

test('me endpoint returns the current profile through the cookie', async () => {
  const registerRes = await registerUser({ email: 'alice@example.com' });
  const res = await request(app).get('/api/auth/me').set('Origin', 'http://localhost:5173').set('Cookie', cookieFrom(registerRes));
  assert.equal(res.status, 200);
  assert.equal(res.body.user.email, 'alice@example.com');
});

test('me endpoint rejects an invalid token', async () => {
  const res = await request(app).get('/api/auth/me').set('Origin', 'http://localhost:5173').set('Cookie', 'studymind_token=not-a-valid-token');
  assert.equal(res.status, 401);
});

test('profile can be updated via patch', async () => {
  const registerRes = await registerUser({ email: 'alice@example.com' });
  const res = await request(app)
    .patch('/api/auth/profile')
    .set('Origin', 'http://localhost:5173').set('Cookie', cookieFrom(registerRes))
    .send({ name: 'Alice Updated', settings: { theme: 'dark', dailyFocusGoalMinutes: 45 } });

  assert.equal(res.status, 200);
  assert.equal(res.body.user.name, 'Alice Updated');
  assert.equal(res.body.user.settings.theme, 'dark');
});

test('logout revokes the authenticated session', async () => {
  const registerRes = await registerUser({ email: 'logout@example.com' });
  const cookie = cookieFrom(registerRes);
  assert.equal((await request(app).get('/api/auth/me').set('Origin', 'http://localhost:5173').set('Cookie', cookie)).status, 200);

  const logoutRes = await request(app).post('/api/auth/logout').set('Origin', 'http://localhost:5173').set('Cookie', cookie);
  assert.equal(logoutRes.status, 200);
  assert.match(logoutRes.headers['set-cookie'][0], /studymind_token=;/i);
  assert.equal((await request(app).get('/api/auth/me').set('Origin', 'http://localhost:5173').set('Cookie', cookie)).status, 401);
});

test('password change revokes the old session and issues a new cookie', async () => {
  const registerRes = await registerUser({ email: 'password@example.com' });
  const oldCookie = cookieFrom(registerRes);
  const changeRes = await request(app)
    .patch('/api/auth/change-password')
    .set('Origin', 'http://localhost:5173').set('Cookie', oldCookie)
    .send({ currentPassword: 'StrongPass123', newPassword: 'NewStrongPass456' });

  assert.equal(changeRes.status, 200);
  assert.equal('token' in changeRes.body, false);
  const newCookie = cookieFrom(changeRes);
  assert.equal((await request(app).get('/api/auth/me').set('Origin', 'http://localhost:5173').set('Cookie', oldCookie)).status, 401);
  assert.equal((await request(app).get('/api/auth/me').set('Origin', 'http://localhost:5173').set('Cookie', newCookie)).status, 200);
});

test('password change rejects the wrong current password', async () => {
  const registerRes = await registerUser({ email: 'wrong-current@example.com' });
  const res = await request(app)
    .patch('/api/auth/change-password')
    .set('Origin', 'http://localhost:5173').set('Cookie', cookieFrom(registerRes))
    .send({ currentPassword: 'WrongPass123', newPassword: 'NewStrongPass456' });
  assert.equal(res.status, 400);
});

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

const makeRequest = (method, path, { token, body } = {}) => {
  const req = request(app)[method](path);
  if (token) {
    req.set('Authorization', `Bearer ${token}`);
  }
  return body ? req.send(body) : req;
};

const registerUser = async (payload = {}) => {
  return makeRequest('post', '/api/auth/register', {
    body: {
      name: 'Alice Learner',
      email: 'alice@example.com',
      password: 'StrongPass123',
      ...payload
    }
  });
};

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

test('register creates a user and returns a token', async () => {
  const res = await registerUser({ email: 'alice@example.com' });
  assert.equal(res.status, 201);
  assert.ok(res.body.token);
  assert.equal(res.body.user.email, 'alice@example.com');
  assert.equal(res.body.user.name, 'Alice Learner');
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

test('login works with the registered user', async () => {
  await registerUser({ email: 'alice@example.com' });
  const res = await makeRequest('post', '/api/auth/login', {
    body: { email: 'alice@example.com', password: 'StrongPass123' }
  });

  assert.equal(res.status, 200);
  assert.ok(res.body.token);
  assert.equal(res.body.user.email, 'alice@example.com');
});

test('wrong password is rejected', async () => {
  await registerUser({ email: 'wrong-password@example.com' });
  const res = await makeRequest('post', '/api/auth/login', {
    body: { email: 'wrong-password@example.com', password: 'WrongPass123' }
  });
  assert.equal(res.status, 401);
});

test('me endpoint returns the current profile', async () => {
  const registerRes = await registerUser({ email: 'alice@example.com' });
  const token = registerRes.body.token;

  const res = await makeRequest('get', '/api/auth/me', { token });

  assert.equal(res.status, 200);
  assert.equal(res.body.user.email, 'alice@example.com');
  assert.equal(res.body.user.name, 'Alice Learner');
});

test('me endpoint rejects an invalid token', async () => {
  const res = await makeRequest('get', '/api/auth/me', {
    token: 'not-a-valid-token'
  });
  assert.equal(res.status, 401);
});

test('profile can be updated via patch', async () => {
  const registerRes = await registerUser({ email: 'alice@example.com' });
  const token = registerRes.body.token;

  const res = await makeRequest('patch', '/api/auth/profile', {
    token,
    body: { name: 'Alice Updated', settings: { theme: 'dark', dailyFocusGoalMinutes: 45 } }
  });

  assert.equal(res.status, 200);
  assert.equal(res.body.user.name, 'Alice Updated');
  assert.equal(res.body.user.settings.theme, 'dark');
  assert.equal(res.body.user.settings.dailyFocusGoalMinutes, 45);
});

test('password can be changed via patch', async () => {
  const registerRes = await registerUser({ email: 'alice@example.com' });
  const token = registerRes.body.token;

  const changeRes = await makeRequest('patch', '/api/auth/change-password', {
    token,
    body: { currentPassword: 'StrongPass123', newPassword: 'NewStrongPass456' }
  });

  assert.equal(changeRes.status, 200);
  assert.match(changeRes.body.message, /updated/i);

  const loginRes = await makeRequest('post', '/api/auth/login', {
    body: { email: 'alice@example.com', password: 'NewStrongPass456' }
  });

  assert.equal(loginRes.status, 200);
  assert.ok(loginRes.body.token);
});

test('password change rejects the wrong current password', async () => {
  const registerRes = await registerUser({ email: 'wrong-current@example.com' });
  const res = await makeRequest('patch', '/api/auth/change-password', {
    token: registerRes.body.token,
    body: { currentPassword: 'WrongPass123', newPassword: 'NewStrongPass456' }
  });
  assert.equal(res.status, 400);
});

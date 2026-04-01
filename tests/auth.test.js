const request = require('supertest');
const mongoose = require('mongoose');
const app      = require('../src/app');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatapp_test');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('Auth routes', () => {
  let accessToken;

  it('POST /auth/register — creates a user', async () => {
    const res = await request(app).post('/auth/register').send({
      username: 'testuser',
      email:    'test@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body.user.username).toBe('testuser');
  });

  it('POST /auth/login — returns tokens', async () => {
    const res = await request(app).post('/auth/login').send({
      email:    'test@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    accessToken = res.body.accessToken;
  });

  it('POST /auth/login — rejects wrong password', async () => {
    const res = await request(app).post('/auth/login').send({
      email:    'test@example.com',
      password: 'wrong',
    });
    expect(res.status).toBe(401);
  });

  it('GET /users/me — returns current user', async () => {
    const res = await request(app)
      .get('/users/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.username).toBe('testuser');
  });
});

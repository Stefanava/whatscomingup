import { describe, expect, it, vi, beforeEach } from 'vitest';
import request from 'supertest';
import createApp from '../server/app.js';

// createApp(pool) takes the DB pool as a parameter specifically so tests
// can wire up a fake pool here instead of hitting the real production
// database that this repo's .env points at.
const queryMock = vi.fn();
const app = createApp({ query: queryMock });

beforeEach(() => {
  queryMock.mockReset();
  queryMock.mockResolvedValue({ rows: [] });
});

describe('GET /__gtg', () => {
  it('reports healthy without touching the database', async () => {
    const res = await request(app).get('/__gtg');
    expect(res.status).toBe(200);
    expect(res.text).toBe('Good to go');
    expect(queryMock).not.toHaveBeenCalled();
  });
});

describe('POST /get-venues', () => {
  it('filters to active venues when active=TRUE', async () => {
    queryMock.mockResolvedValue({ rows: [{ id: 1, name: 'Test Venue' }] });
    const res = await request(app).post('/get-venues').send({ active: 'TRUE' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 1, name: 'Test Venue' }]);
    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining("WHERE active = 'TRUE'"));
  });

  it('returns all venues when active is omitted', async () => {
    await request(app).post('/get-venues').send({});
    expect(queryMock).toHaveBeenCalledWith(expect.not.stringContaining('WHERE'));
  });

  it('returns an empty array if the query fails, instead of erroring', async () => {
    queryMock.mockRejectedValueOnce(new Error('connection refused'));
    const res = await request(app).post('/get-venues').send({ active: 'TRUE' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('GET /get-events', () => {
  it('returns rows from the database', async () => {
    queryMock.mockResolvedValue({ rows: [{ id: 1, title: 'Test Event' }] });
    const res = await request(app).get('/get-events');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 1, title: 'Test Event' }]);
  });

  it('returns an empty array if the query fails, instead of erroring', async () => {
    queryMock.mockRejectedValueOnce(new Error('connection refused'));
    const res = await request(app).get('/get-events');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('POST /auth/favourites', () => {
  it('requires an authenticated session', async () => {
    const res = await request(app).post('/auth/favourites').send({ venues: ['some-venue'] });
    expect(res.status).toBe(401);
    expect(queryMock).not.toHaveBeenCalled();
  });
});

describe('unknown methods', () => {
  it('does not accept GET on /get-venues (it is POST-only)', async () => {
    const res = await request(app).get('/get-venues');
    expect(res.status).toBe(404);
  });
});

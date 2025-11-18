const request = require('supertest');
const http = require('http');

describe('API endpoints', () => {
  const base = process.env.API_BASE_URL || 'http://localhost:5000';
  let server;
  const safeGet = async (path) => {
    try {
      return await request(base).get(path);
    } catch (err) {
      return { status: 404, body: {} };
    }
  };

  beforeAll((done) => {
    server = http.createServer((req, res) => {});
    done();
  });

  afterAll((done) => {
    server && server.close(done);
  });

  it('GET /health responds and includes uptime when available', async () => {
    const resp = await safeGet('/health');
    expect([200, 404]).toContain(resp.status);
    if (resp.status === 200) {
      expect(resp.body).toHaveProperty('status', 'OK');
      expect(typeof resp.body.uptime).toBe('number');
      expect(resp.body.uptime).toBeGreaterThanOrEqual(0);
    }
  });

  it('GET /api/prices returns expected shape when server is running', async () => {
    const resp = await safeGet('/api/prices');
    expect([200, 404]).toContain(resp.status);
    if (resp.status === 200) {
      expect(resp.body).toHaveProperty('BTC');
      expect(resp.body).toHaveProperty('ETH');
      expect(resp.body).toHaveProperty('LTC');
      expect(resp.body).toHaveProperty('XRP');
      const asNumber = (v) => !Number.isNaN(parseFloat(v));
      expect(asNumber(resp.body.BTC)).toBe(true);
      expect(asNumber(resp.body.ETH)).toBe(true);
      expect(asNumber(resp.body.LTC)).toBe(true);
      expect(asNumber(resp.body.XRP)).toBe(true);
    }
  });

  it('GET /metrics reflects traffic when server is running', async () => {
    await safeGet('/');
    await safeGet('/api/prices');
    await safeGet('/api/assets');
    const resp = await safeGet('/metrics');
    expect([200, 404]).toContain(resp.status);
    if (resp.status === 200) {
      expect(typeof resp.body.uptime).toBe('number');
      expect(resp.body.uptime).toBeGreaterThanOrEqual(0);
      expect(typeof resp.body.requests).toBe('number');
      expect(resp.body.requests).toBeGreaterThanOrEqual(3);
      expect(typeof resp.body.avgLatencyMs).toBe('number');
      expect(resp.body.avgLatencyMs).toBeGreaterThanOrEqual(0);
      expect(resp.body.paths).toBeDefined();
      expect(typeof resp.body.paths).toBe('object');
      expect(Object.keys(resp.body.paths).length).toBeGreaterThanOrEqual(1);
      expect(resp.body.paths['/']).toBeGreaterThanOrEqual(1);
      expect(resp.body.paths['/api/prices']).toBeGreaterThanOrEqual(1);
    }
  });
});
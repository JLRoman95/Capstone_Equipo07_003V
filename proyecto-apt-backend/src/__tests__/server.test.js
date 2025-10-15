const request = require('supertest');
const app = require('../app'); // Adjust the path as necessary

describe('Server Endpoints', () => {
    test('GET / should respond with status 200', async () => {
        const response = await request(app).get('/');
        expect(response.statusCode).toBe(200);
    });

    test('GET /api should respond with JSON', async () => {
        const response = await request(app).get('/api');
        expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
    });
});
//@ts-check
const Redis = require('ioredis').default;

const port = Number(process.env.REDIS_PORT) || 6379;
const host = process.env.REDIS_HOST || 'localhost';
const password = process.env.REDIS_PASSWORD;

module.exports = new Redis(port, host, { password });
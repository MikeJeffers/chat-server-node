//@ts-check
require('./preload');
const postgres = require('postgres');

const SQL = postgres({
  max: 10,
  idle_timeout: 25,
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'test',
  username: process.env.POSTGRES_USER || 'username',
  password: process.env.POSTGRES_PASSWORD || 'password',
  transform: {
    undefined: null
  },
  types: {
    bigint: postgres.BigInt
  },
  connection: {
    timezone: 'UTC',
  },
  debug: process.env.NODE_ENV != 'production'
});

module.exports = SQL;

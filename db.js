const { Pool } = require('pg');

const pool = new Pool({
  user: 'thisi',
  host: 'localhost',
  database: 'OnTrak',
  password: 'Cyc072004!4',
  port: 5432,
});

module.exports = pool;
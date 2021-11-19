require('dotenv').config();
const pg = require('pg');

const db = new pg.Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: process.env.DB_PASSWORD,
    post: 5432,
});

module.exports.db;
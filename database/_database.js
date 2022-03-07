require('dotenv').config();
const { Client } = require('pg');
const db = new Client({
    user: process.env.DATABASE_USER,
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE,
    password: process.env.DATABASE_PASSWORD,
    port: 5432,
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = db;

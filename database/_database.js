const { Client } = require('pg');
const db = new Client({
    user: 'lfdxxqlkqylxnj',
    host: 'ec2-63-33-239-176.eu-west-1.compute.amazonaws.com',
    database: 'df86puep2050be',
    password: 'a4df878c5ad8dff229424405fd9b14a90cdda032561878440e5d4524edcdd4ec',
    port: 5432,
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = db;

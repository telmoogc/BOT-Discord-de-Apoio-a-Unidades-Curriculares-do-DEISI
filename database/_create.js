const db = require('./_database');

async function createTables() {
    await db.connect();

    await db.query(`CREATE TABLE student (
        id  serial PRIMARY KEY,
        stu_name VARCHAR (50) NOT NULL
    )`);

    await db.query(`CREATE TABLE answer (
        id serial PRIMARY KEY,
        stu_name VARCHAR (50) NOT NULL
    )`);

    await db.query(`CREATE TABLE student_answer (
        student_id integer NOT NULL,
        answer_id integer NOT NULL,
        PRIMARY KEY (student_id, answer_id),
        FOREIGN KEY (student_id) REFERENCES student (id),
        FOREIGN KEY (answer_id) REFERENCES answer (id),
    )`);

    await db.end();

    console.log("Tables created successfully!")
}
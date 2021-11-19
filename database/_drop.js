const db = require('./_database');

async function dropTables(){
    await db.connect();
    await db.query("DROP TABLE student CASCATE");
    await db.query("DROP TABLE answer CASCATE");
    await db.query("DROP TABLE student_answer CASCATE");
    await db.end();

    console.log("Table droped successfully!");
}

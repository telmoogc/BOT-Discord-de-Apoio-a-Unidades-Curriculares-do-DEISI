const db = require('./_database.js');
const { Client, Intents } = require('discord.js');

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

async function insertData(){
    console.log("insertData called - " + db);
    db.connect();
    console.log("Connected to BD");

    // Criar aluno
    const queryStudent = "INSERT INTO student (stu_name) VALUES ($1)";

    console.log("queryStudent debug 1");

    client.on('message', (message) => {
        const newStudent = db.query(queryStudent, [message.author.username]);
    });

    console.log("queryStudent debug 2");

    db.query(queryStudent, [string]);

    console.log("queryStudent debug 3");


    // Criar resposta do aluno
    const queryAnswer = "INSERT INTO answer (stu_answer) VALUES ($1)";

    console.log("queryAnswer debug 1");

    client.on('message', (message) => {
        const newAnswer = db.query(queryAnswer, [message.content]);
    });

    console.log("queryAnswer debug 2");

    db.query(queryAnswer, [string]);

    console.log("queryAnswer debug 3");


    //Adicionar respostas aos alunos
    const queryStudentAnswer = "INSERT INTO student_answer (student_id, answer_id) VALUES ($1, $2)";

    console.log("queryStudentAnswer debug 1");

    client.on('message', (message) => {
        const newStudent = db.query(queryStudentAnswer, [message.author.id, message.id]);
    });

    console.log("queryStudentAnswer debug 2");

    db.query(queryAnswer, [string, string]);

    console.log("queryStudentAnswer debug 3");

    db.end();
    console.log("data inserted successfully!")
}

module.exports = insertData;
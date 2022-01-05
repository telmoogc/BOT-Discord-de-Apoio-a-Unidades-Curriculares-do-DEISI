const db = require('./_database');
const { Client } = require("discord.js");

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

async function insertData(){
    db.connect();


    // Criar aluno
    const queryStudent = "INSERT INTO student (stu_name) VALUES ($1)";

    client.on('message', (message) => {
        const newStudent = db.query(queryStudent, [message.author.username]);
    });

    db.query(queryStudent, [string]);


    // Criar resposta do aluno
    const queryAnswer = "INSERT INTO answer (stu_answer) VALUES ($1)";

    client.on('message', (message) => {
        const newAnswer = db.query(queryAnswer, [message.content]);
    });

    db.query(queryAnswer, [string]);


    //Adicionar respostas aos alunos
    const queryStudentAnswer = "INSERT INTO student_answer (student_id, answer_id) VALUES ($1, $2)";

    client.on('message', (message) => {
        const newStudent = db.query(queryStudentAnswer, [message.author.id, message.id]);
    });

    db.query(queryAnswer, [string, string]);



    db.end();
    console.log("data inserted successfully!")
}

module.exports = insertData;
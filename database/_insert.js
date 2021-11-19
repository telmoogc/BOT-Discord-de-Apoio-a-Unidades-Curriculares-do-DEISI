const db = require('./_database');
const { Client } = require("discord.js");

const client = new Client();

async function insertData(){
    await db.connect();


    // Criar aluno
    const queryStudent = "INSERT INTO student (stu_name) VALUES ($1)";

    client.on('message', (message) => {
        const newStudent = await db.query(queryStudent, [message.author.username]);
    });

    /*
        await db.query(queryStudent, [string]);
    */


    // Criar resposta do aluno
    const queryAnswer = "INSERT INTO answer (stu_answer) VALUES ($1)";

    client.on('message', (message) => {
        const newAnswer = await db.query(queryAnswer, [message.content]);
    });

    /*
        await db.query(queryAnswer, [string]);
    */


    //Adicionar respostas aos alunos
    const queryStudentAnswer = "INSERT INTO student_answer (student_id, answer_id) VALUES ($1, $2)";

    client.on('message', (message) => {
        const newStudent = await db.query(queryStudentAnswer, [message.author.id, message.id]);
    });

    /*
        await db.query(queryAnswer, [string, string]);
    */


    await db.end();
    
    console.log("data inserted successfully!")
}
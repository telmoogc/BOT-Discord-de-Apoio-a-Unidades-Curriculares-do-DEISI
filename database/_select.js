const db = require("./_database");

async function selectData (){
    await db.connect();

    var result;

    //Mostra os alunos todos
    result = await db.query("SELECT * FROM student");
    console.log("ALUNOS: ")
    console.log(result.rows);


    //Mostra as respostas todas
    result = await db.query("SELECT * FROM answer");
    console.log("RESPOSTAS: ")
    console.log(result.rows);

    
    //Mostra os alunos e as respectivas respostas
    result = await db.query("SELECT e.stu_name AS student, p.stu_answer AS answer FROM student AS e, answer AS p, student_answer ep WHERE ep.student_id = e.id AND ep.answer_id = p.id");
    console.log("RESPOSTAS DOS ALUNOS: ");
    console.log(result.rows);
}
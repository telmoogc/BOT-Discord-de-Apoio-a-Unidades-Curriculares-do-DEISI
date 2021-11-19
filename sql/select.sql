SELECT * FROM student;
SELECT * FROM answer;
SELECT e.stu_name AS student, p.stu_answer AS answer FROM student AS e, answer AS p, student_answer ep WHERE ep.student_id = e.id AND ep.answer_id = p.id;
CREATE TABLE student (
    id serial PRIMARY KEY,
    stu_name VARCHAR (50) NOT NULL
);

CREATE TABLE answer (
    id serial PRIMARY KEY,
    stu_answer VARCHAR (50) NOT NULL
);

CREATE TABLE student_answer (
    student_id INTEGER NOT NULL,
    answer_id INTEGER NOT NULL,
    PRIMARY KEY (student_id, answer_id),
    FOREIGN KEY (student_id) REFERENCES student (id),
    FOREIGN KEY (answer_id) REFERENCES answer (id)
);
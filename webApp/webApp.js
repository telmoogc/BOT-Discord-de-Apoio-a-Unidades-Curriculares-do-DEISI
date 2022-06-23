//***********************************************************************************************\\
//   https://discord.com/oauth2/authorize?client_id=904855826647379969&scope=bot&permissions=8    \\
//*************************************************************************************************\\

const express = require("express");
const sessions = require('express-session');
const bodyParser = require("body-parser");
const path = require('path');
const db = require('../database/_database');
var utils = require('./utils/secounds-to-date');

const limitePorQuerie = 5


const app = express();
app.set('views', `${__dirname}/views`);
app.use(express.static(`${__dirname}/public`));

app.set('view engine', 'ejs');

//session init
const oneDay = 1000 * 60 * 60 * 24;
app.use(sessions({
    secret: "934dcc00-a587-11ec-a2fe-af4ebb6498ab",
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false
}));

app.get("/sair", async function (req, res) {
    req.session.userId = null;
    res.redirect('/');
});

app.get("/", function (req, res) {
    if (req.session.userId || req.session.userId != null) {
        db.query('select u.user_name,uc.* from users_unidades_curriculares uuc, users u, unidades_curriculares uc ' +
            'where u.discord_id = uuc.discord_user_id ' +
            'and uc.server_id = uuc.discord_server_id ' +
            'and uc.deleted = false ' +
            'and u.uuid like $1', [req.session.userId], (error, results) => {
                if (error) {
                    throw error
                }
                res.status(200).render("main-menu", { ucs: results.rows, usr: results.rows[0].user_name });
            });
    } else {
        res.status(200).render("index");
    }
});

app.get("/login", function (req, res) {
    if (!req.session.userId) {
        if (!req.query.email) {

        }
        if (!req.query.password) {

        }
        db.query('select * from users where user_number like $1 and password like $2', [req.query.email, req.query.password], (error, results) => {
            if (error) {
                throw error
            }
            if (results.rows.length > 0) {
                req.session.userId = results.rows[0].uuid;
                res.redirect('/');
            } else {
                return res.status(200).json('bad login');
            }

        });
    }
});

app.get("/uc-details/:id", function (req, res) {

    if (req.session.userId) {
        db.query('select u.user_name from users u where u.uuid like $1', [req.session.userId], (error0, results0) => {
            if (error0) {
                throw error0
            }
            db.query('select uc.server_id,uc.uc_name,u.uuid,u.discord_id,u.user_name from users_unidades_curriculares uuc,unidades_curriculares uc ,users u ' +
                'where uuc.discord_server_id = uc.server_id ' +
                'and uuc.discord_user_id = u.discord_id ' +
                'and uc.uuid like $1', [req.params.id], (error, results) => {
                    if (error) {
                        throw error
                    }
                    if (results.rows.length > 0) {

                        db.query(`select us.user_name,st.discord_user_id,count(*) as quantidade ` +
                            `from students_threads st,users us ` +
                            `where us.discord_id = st.discord_user_id ` +
                            `and st.discord_server_id  = $1 ` +
                            `and us.user_name like 'a%' ` +
                            `and deleted = false ` +
                            `group by us.user_name,discord_user_id ` +
                            `order by quantidade desc ` +
                            `limit $2`, [results.rows[0].server_id, limitePorQuerie], (error2, results2) => {
                                if (error2) {
                                    throw error2
                                }

                                db.query(`select u.user_name,ti.discord_user_id,count(*) as quantidade ` +
                                    `from threads_interactions ti,users u ` +
                                    `where ti.discord_user_id  = u.discord_id ` +
                                    ` and ti.discord_server_id  = $1 ` +
                                    `and u.user_name like 'a%' ` +
                                    `and deleted = false ` +
                                    `group by u.user_name,ti.discord_user_id ` +
                                    ` order by quantidade desc ` +
                                    `limit $2`, [results.rows[0].server_id, limitePorQuerie], (error3, results3) => {
                                        if (error3) {
                                            throw error3
                                        }

                                        db.query(`select u.user_name,ti.discord_user_id,count(*) as quantidade 
            from threads_interactions ti,users u
            where ti.discord_user_id  = u.discord_id
            and ti.discord_server_id  = $1
            and ti.good_message = true
            and u.user_name like 'a%'
            and deleted = false
            group by u.user_name,ti.discord_user_id 
            order by quantidade desc
            limit $2;`, [results.rows[0].server_id, limitePorQuerie], (error4, results4) => {
                                            if (error4) {
                                                throw error4
                                            }

                                            db.query(`select us.user_name,st.discord_user_id,count(*) as quantidade 
            from students_threads st,users us 
            where us.discord_id = st.discord_user_id
            and st.good_thread = true
            and st.discord_server_id = $1
            and us.user_name like 'a%'
            and deleted = false
            group by us.user_name,discord_user_id 
            order by quantidade desc
            limit $2`, [results.rows[0].server_id, limitePorQuerie], (error5, results5) => {
                                                if (error5) {
                                                    throw error5
                                                }

                                                db.query(`SELECT ti.thread_id,st.created_at,min(ti.created_at) as last_at,
            EXTRACT(EPOCH FROM (TO_TIMESTAMP(min(ti.created_at),  'DD-MM-YYYY HH24:MI:SS')-TO_TIMESTAMP(st.created_at,  'DD-MM-YYYY HH24:MI:SS'))) as elapsetime
            FROM students_threads st,threads_interactions ti  
            where st.thread_id = ti.thread_id
            and ti.created_at is not null
            and st.created_at is not null 
            and st.discord_server_id = $2
            and ti.discord_user_id <> st.discord_user_id
            group by ti.thread_id,st.created_at
            order by elapsetime asc
            limit $1`, [limitePorQuerie,results.rows[0].server_id], (error6, results6) => {
                                                    if (error6) {
                                                        throw error6
                                                    }

            db.query(`SELECT ti.thread_id,st.created_at,max(ti.created_at) as last_at,
            EXTRACT(EPOCH FROM (TO_TIMESTAMP(max(ti.created_at),  'DD-MM-YYYY HH24:MI:SS')-TO_TIMESTAMP(st.created_at,  'DD-MM-YYYY HH24:MI:SS'))) as elapsetime
            FROM students_threads st,threads_interactions ti  
            where st.thread_id = ti.thread_id
            and ti.created_at is not null
            and st.created_at is not null 
            and st.discord_server_id = $2
            group by ti.thread_id,st.created_at
            order by elapsetime desc
            limit $1`, [limitePorQuerie,results.rows[0].server_id], (error7, results7) => {
                                                        if (error7) {
                                                            throw error7
                                                        }

                                                        db.query(`SELECT  (
                                                            SELECT COUNT(*)
                                                            FROM   students_threads
                                                            where discord_server_id = $1
                                                            and deleted = false
                                                            ) AS threads ,
                                                            (
                                                            SELECT COUNT(*)
                                                            FROM   threads_interactions ti 
                                                            where discord_server_id = $1
                                                            and deleted = false
                                                            ) AS interacoes`, [results.rows[0].server_id], (error8, results8) => {
                                                            if (error8) {
                                                                throw error8
                                                            }

                                                            if (results.rows.length > 0) {
                                                                res.status(200).render('uc-details', { userinfo: results0.rows[0].user_name, ucdocentes: results.rows, topalunos: results2.rows, topinteracoes: results3.rows, topboasrespostas: results4.rows, topboasthreads: results5.rows, tempoprimeira: results6.rows, tempoultima: results7.rows, estatisticas:results8.rows[0], utils: utils });
                                                            } else {
                                                                res.redirect(req.header('Referer') || '/');
                                                            }
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            }

                });
        });
    } else {
        res.redirect(req.header('Referer') || '/');
    }
});

app.listen(process.env.PORT || 3000, function () {
    db.connect();
    console.log("Server started on port 3000");
});

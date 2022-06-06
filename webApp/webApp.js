//***********************************************************************************************\\
//   https://discord.com/oauth2/authorize?client_id=904855826647379969&scope=bot&permissions=8    \\
//*************************************************************************************************\\

const express = require("express");
const sessions = require('express-session');
const bodyParser = require("body-parser");
const path = require('path');
const db = require('../database/_database');


const app = express();
app.set('views', `${__dirname}/views`);
app.use(express.static(`${__dirname}/public`));

app.set('view engine', 'ejs');

//session init
const oneDay = 1000 * 60 * 60 * 24;
app.use(sessions({
    secret: "934dcc00-a587-11ec-a2fe-af4ebb6498ab",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false 
}));

app.get("/sair", async function(req, res){
    req.session.userId = null;
    res.redirect('/');
});

app.get("/", function(req, res){
    if(req.session.userId || req.session.userId != null){
       db.query('select u.user_name,uc.* from users_unidades_curriculares uuc, users u, unidades_curriculares uc '+ 
       'where u.discord_id = uuc.discord_user_id '+
       'and uc.server_id = uuc.discord_server_id '+
       'and uc.deleted = false '+
       'and u.uuid like $1',[req.session.userId], (error, results) => {
           if (error) {
             throw error
           }
           res.status(200).render("main-menu", { ucs: results.rows,usr: "bananas" });
         });
    }else{
        res.status(200).render("index");
    }
});

app.get("/login", function(req, res){
    if(!req.session.userId){
        if(!req.query.email){

        }
        if(!req.query.password){

        }
        db.query('select * from users where user_number like $1 and password like $2',[req.query.email,req.query.password], (error, results) => {
            if (error) {
              throw error
            }
            if (results.rows.length>0){
                req.session.userId = results.rows[0].uuid;
                res.redirect('/');
            }else{
                return res.status(200).json('bad login');
            }
           
          });
    }
});

app.get("/uc-details/:id", function(req, res){
    db.query('select uc.uc_name,u.uuid,u.discord_id,u.user_name from users_unidades_curriculares uuc,unidades_curriculares uc ,users u '+ 
    'where uuc.discord_server_id = uc.server_id '+
    'and uuc.discord_user_id = u.discord_id '+
    'and uc.uuid like $1',[req.params.id], (error, results) => {
        if (error) {
          throw error
        }
        if(results.rows.length >0){
            res.status(200).render( 'uc-details', { users:results.rows } );
        }else{
            res.redirect(req.header('Referer') || '/');
        }
        
      });
});

app.listen(process.env.PORT || 3000, function(){
    db.connect();
    console.log("Server started on port 3000");
});
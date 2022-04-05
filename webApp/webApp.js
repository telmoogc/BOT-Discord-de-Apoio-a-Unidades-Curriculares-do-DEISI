const express = require("express");
const bodyParser = require("body-parser");
const path = require('path');
const db = require('../database/_database');


const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');


const knex = require('knex')({
    client: 'pg',
    connection: {
      host : process.env.DATABASE_HOST,
      port : process.env.PORT,
      user : process.env.DATABASE_USER,
      password : process.env.DATABASE_PASSWORD,
      database : process.env.DATABASE
    }
  });

app.get("/", function(req, res){

    res.render("index");
    //res.sendFile(__dirname + "/index.html");
});

app.get("/main-menu", function(req, res){

    const results = db.query('select * from unidades_curriculares');
    res.render("main-menu", { ucs: results.rows });


    /*knex.select('*').from('unidades_curriculares').then((results) => {
        res.render("main-menu", { uc: results });
    });
    */

    //res.sendFile(__dirname + "/main-menu.html");
});

app.get("/uc-details", function(req, res){
    res.render("uc-details");
    //res.sendFile(__dirname + "/uc-details.html");
});

app.listen(process.env.PORT || 80, function(){
    console.log("Server started on port 3000");
});
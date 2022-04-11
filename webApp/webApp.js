//***********************************************************************************************\\
//   https://discord.com/oauth2/authorize?client_id=904855826647379969&scope=bot&permissions=8    \\
//*************************************************************************************************\\

const express = require("express");
const bodyParser = require("body-parser");
const path = require('path');
const db = require('../database/_database');


const app = express();
app.set('views', `${__dirname}/views`);
app.use(express.static(`${__dirname}/public`));

app.set('view engine', 'ejs');


app.get("/", function(req, res){

    res.render("index");
    //res.sendFile(__dirname + "/index.html");
});

app.get("/main-menu", async function(req, res){
    db.query('select * from unidades_curriculares', (error, results) => {
        if (error) {
          throw error
        }
        //res.status(200).json(results.rows);
        res.status(200).render("main-menu", { ucs: results.rows });
      });


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
    db.connect();
    console.log("Server started on port 3000");
});
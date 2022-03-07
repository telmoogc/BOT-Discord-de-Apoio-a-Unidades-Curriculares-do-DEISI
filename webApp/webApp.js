const express = require("express");
const bodyParser = require("body-parser");


const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.set('view engine', 'ejs');


app.get("/", function(req, res){
    res.sendFile(__dirname + "/index.html");
});

app.get("/main-menu", function(req, res){
    res.sendFile(__dirname + "/main-menu.html");
});

app.get("/uc-details", function(req, res){
    res.sendFile(__dirname + "/uc-details.html");
});

app.listen(process.env.PORT || 80, function(){
    console.log("Server started on port 3000");
});
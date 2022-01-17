require('dotenv').config();
const { Client, Intents } = require('discord.js');
const Eris = require("eris");
const insertData = require('./database/_insert');
const db = require('./_database.js');

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
let bot = new Eris(process.env.BOT_TOKEN);

let prefix = "!";


client.once('ready', () => {
    console.log('Estou online');
    db.connect();
    console.log("DB connectada");
});



bot.on("messageCreate", async message => {
    if(message.author.bot || !message.channel.guild) return;
    if(!message.content.startsWith(prefix)) return;

    if(message.content.startsWith(prefix)){
        return bot.createMessage(message.channel.id, message.content.substr(1,message.content.length));
    }
});




bot.on("messageCreate", async message => {
    console.log("ESTOU AQUI!!!!!");


    const queryStudent = "INSERT INTO student (stu_name) VALUES ($1)";

    console.log("queryStudent debug 1");

    client.on('message', (message) => {
        const newStudent = db.query(queryStudent, [message.author.username]);
    });

    console.log("queryStudent debug 2");

    db.query(queryStudent, [string]);

    console.log("queryStudent debug 3");


    console.log("SUPOSTAMENTE INSERI OS DADOS");
});


bot.connect();



client.login(process.env.BOT_TOKEN);
require('dotenv').config();
const { Client, Intents } = require('discord.js');
const Eris = require("eris");
const insertData = require('./database/_insert');

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
let bot = new Eris(process.env.BOT_TOKEN);

let prefix = "!";


client.once('ready', () => {
    console.log('Estou online');
});



bot.on("messageCreate", async message => {
    if(message.author.bot || !message.channel.guild) return;
    if(!message.content.startsWith(prefix)) return;

    if(message.content.startsWith(prefix)){
        return bot.createMessage(message.channel.id, message.content.substr(1,message.content.length));
    }
});




bot.on("messageCreate", async message => {
    insertData
});


bot.connect();



client.login(process.env.BOT_TOKEN);
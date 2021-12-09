require('dotenv').config();
const { Client, Intents } = require('discord.js');
const Eris = require("eris");
const db = require('./_database');

const client = new Client({intents: [Intents.FLAGS.GUILDS]});
let bot = new Eris(process.env.BOT_TOKEN);

let prefix = "!";


client.once('ready', () => {
    console.log('Estou online');
});




/*
var temp = "";
bot.on("messageCreate", (msg) => {
    if(msg.content != temp){
        bot.createMessage(msg.channel.id, msg.content);
        temp = msg.content;
    }
}); */


/*
var temp = "";
bot.on("messageCreate", (msg) => {
    if(msg.content != temp) {
        if(msg.content === "!stop") {
            bot.createMessage(msg.channel.id, "Calei-me");
            temp = "!stop";
          } else {
              bot.createMessage(msg.channel.id, msg.content);
              temp = msg.content;
          }
    }
    
  });
*/


bot.on("messageCreate", async message => {
    if(message.author.bot || !message.channel.guild) return;
    if(!message.content.startsWith(prefix)) return;

    if(message.content.startsWith(prefix)){
        return bot.createMessage(message.channel.id, message.content.substr(1,message.content.length));
    }
});


/*
bot.on("messageCreate", async message => {
    newStudent()
});
*/

bot.connect();



client.login(process.env.BOT_TOKEN);
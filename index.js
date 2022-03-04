require('dotenv').config();
const { Client, Intents } = require('discord.js');
const Eris = require("eris");
const db = require('./database/_database');
const {v1: uuidv1} = require('uuid');
const insertData = require('./database/_insert');

const client = new Client({ intents: [Intents.FLAGS.GUILDS,Intents.FLAGS.GUILD_MEMBERS] });
let bot = new Eris(process.env.BOT_TOKEN);

var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'validacao.inf.ulht@gmail.com',
        pass: 'jpbktvcfmkycdzxc'
    }
});

let prefix = "!";


client.once('ready', async() => {
    console.log('Estou online');
    /*const { Client } = require('pg');
    const client = new Client({
        user: 'lfdxxqlkqylxnj',
        host: 'ec2-63-33-239-176.eu-west-1.compute.amazonaws.com',
        database: 'df86puep2050be',
        password: 'a4df878c5ad8dff229424405fd9b14a90cdda032561878440e5d4524edcdd4ec',
        port: 5432,
        ssl: {
            rejectUnauthorized: false
        }
    });
    await client.connect();
    const res = await client.query('select * from testes');
    console.log(res.rows[0].nome) ;// Hello world!
    await client.end();*/
    db.connect();
    //const res = await db.query('select * from testes');
    //console.log(res.rows[0].nome) ;// Hello world!
});

//primeira validação de user e criação de row na tabela users em BD
client.on("guildMemberAdd", async (member) => {
    const userAccountN = await db.query('select count(*) from users where discord_id = $1', [member.user.id]);
    if(userAccountN.rows[0].count == 0){
        await db.query('insert into users (uuid,discord_id,student_number,student_name,valid,code) values ($1,$2,$3,$4,$5,$6)',[uuidv1(),member.user.id,'','',false,'']);
        console.log(`[USER REGISTER SERVICE] Utilizador "${member.user.id}" - "${member.user.username}" registado com sucesso!`);
    }
});

bot.on("messageCreate", async message => {
    if(message.author.bot || !message.channel.guild) return;
    if(!message.content.startsWith(prefix)) return;

    if(message.content.startsWith(prefix)){
      //  return bot.createMessage(message.channel.id, message.content.substr(1,message.content.length));
    }

    //processo de validação de user DC e numero de aluno
    let args = message.content.split(' ');
    let command = args.shift().toLowerCase();
    if(command == '!criar'){
        const thread = await client.channels.cache.get('949327324539658272').threads.create({
            name: 'food-talk',
            autoArchiveDuration: 60,
            reason: 'Needed a separate thread for food',
        });

        console.log(`Created thread: ${thread.name}`);
    }
    if (args.length <=2 && command == '!validar' && args[0] != null && args[1] == null){
        if(!args[0].startsWith('a')|| args[0].length<8){
            return bot.createMessage(message.channel.id, 'Usa !validar <a2190XXXX>, não te esqueças do <a> no ínicio do numero de aluno e que o teu numero de aluno apenas pode conter 8 digitos/caracteres.');
        }
        const CodeUUID = uuidv1();
        var mailOptions = {
            from: 'validacao.inf.ulht@gmail.com',
            to: args[0]+'@alunos.ulht.pt',
            subject: 'Validação conta Discord + DEISI',
            text: 'O teu codigo de validação é o '+CodeUUID+'.'
        };

        await db.query('update users set code = $1,student_number = $2 where discord_id = $3',[CodeUUID,args[0],message.author.id]);

        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log('[EMAIL SERVICE] Error: '+error);
            } else {
                console.log('[EMAIL SERVICE] Email enviado: ' + info.response);
            }
        });

        return bot.createMessage(message.channel.id, 'Foi enviado um código para o teu email!\nAssim que receberes ' +
            'executa o comando !validar <aXXXXXX> <codigo do email>');
    }else if(args.length <=2 && command == '!validar' && args[0] != null && args[1] != null){
        //valida o user
        const userAccountN = await db.query('select count(*) from users where discord_id = $1 and code like $2 and student_number like $3', [message.author.id,args[1],args[0]]);
        if(userAccountN.rows[0].count == 1){
            console.log(message.member.nick);
            await db.query('update users set valid = $1,student_name = $2 where discord_id = $3',[true,message.member.nick,message.author.id]);

            return bot.createMessage(message.channel.id, 'Conta validada com sucesso!');
        }else{
            console.log(userAccountN);
            return bot.createMessage(message.channel.id, 'Ocorreu um erro ao validar a conta');
        }

        return bot.createMessage(message.channel.id, 'Em validação...');
    }else{
        return bot.createMessage(message.channel.id, 'Para utilizares este comando usa um destes exemplos:\n' +
            '!validar <aXXXXXX> - Para enviar/reenviar o código para o teu email.\n' +
            '!validar <aXXXXXX> <codigo> - Para validar a tua conta.');
    }
});




bot.on("messageCreate", async message => {
    console.log("ESTOU AQUI!!!!!");
    await db.query('insert into testes (uuid,message) values ($1,$2)',[uuidv1(),message.content]);
    //insertData;
    console.log("SUPOSTAMENTE INSERI OS DADOS");
});


bot.connect();



client.login(process.env.BOT_TOKEN);

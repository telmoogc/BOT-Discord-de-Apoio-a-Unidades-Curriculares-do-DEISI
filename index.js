require('dotenv').config();
const {Client, Intents, TextChannel,ChannelTypes} = require('discord.js');
const db = require('./database/_database');
var nodemailer = require('nodemailer');
const {v1: uuidv1} = require('uuid');

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_INTEGRATIONS,
        Intents.FLAGS.GUILD_PRESENCES,
        Intents.FLAGS.GUILD_WEBHOOKS]
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'validacao.inf.ulht@gmail.com',
        pass: 'jpbktvcfmkycdzxc'
    }
});

let prefix = "!";


client.once('ready', async () => {
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
    if (userAccountN.rows[0].count == 0) {
        await db.query('insert into users (uuid,discord_id,student_number,student_name,valid,code) values ($1,$2,$3,$4,$5,$6)', [uuidv1(), member.user.id, '', '', false, '']);
        console.log(`[USER REGISTER SERVICE] Utilizador "${member.user.id}" - "${member.user.username}" registado com sucesso!`);
        member.roles.add(member.guild.roles.cache.find(role => role.name === "Não-Verificado"));
    } else {
        const userAccount = await db.query('select student_number,valid from users where discord_id = $1', [member.user.id]);
        if (userAccount.rows[0].student_number.toString().startsWith('p') && userAccount.rows[0].valid === true) {
            member.roles.add(member.guild.roles.cache.find(role => role.name === "Docente"));
        } else if (userAccount.rows[0].student_number.toString().startsWith('a') && userAccount.rows[0].valid === true) {
            member.roles.add(member.guild.roles.cache.find(role => role.name === "Aluno"));
        } else {
            member.roles.add(member.guild.roles.cache.find(role => role.name === "Não-Verificado"));
        }
    }
});

client.on("messageCreate", async message => {
    if (message.author.bot || !message.channel.guild) return;
    if (!message.content.startsWith(prefix)) return;

    if (message.content.startsWith(prefix)) {
        //return bot.createMessage(message.channel.id, message.content.substr(1,message.content.length));
    }

    //processo de validação de user DC e numero de aluno
    let args = message.content.split(' ');
    let command = args.shift().toLowerCase();
    if (args.length == 1 && command == '!validar' && args[0] != null && args[1] == null) {
        const valid = await db.query('select valid from users where discord_id = $1', [message.member.id]);
        if (valid.rows[0].valid == true){
            return message.channel.send('A sua conta já está validada!');
        }
        if (!args[0].split('@')[0].toLowerCase().startsWith('a') && !args[0].split('@')[0].toLowerCase().startsWith('p')) {
            return message.channel.send('O endereço de email tem de começar por a (alunos) ou p(professor)!');
        }
        if (args[0].split('@')[1].toLowerCase() != 'alunos.ulht.pt' && args[0].split('@')[1].toLowerCase() != 'ulusofona.pt') {
            return message.channel.send('O endereço de email tem de conter um dos seguintes dominios alunos.ulht.pt ou ulusofona.pt.');
        }
        const CodeUUID = uuidv1();
        var mailOptions = {
            from: 'validacao.inf.ulht@gmail.com',
            to: args[0],
            subject: 'Validação conta Discord + DEISI',
            text: 'O teu codigo de validação é o ' + CodeUUID + '.'
        };

        await db.query('update users set code = $1,student_number = $2 where discord_id = $3', [CodeUUID, args[0].split('@')[0].toLowerCase(), message.member.id]);

        await transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log('[EMAIL SERVICE] Error: ' + error);
            } else {
                console.log('[EMAIL SERVICE] Email enviado: ' + info.response);
            }
        });

        return message.channel.send('Foi enviado um código para o teu email!\nAssim que receberes ' +
            'executa o comando !validar <aXXXXXX> <codigo do email>');

    } else if (args.length == 2 && command == '!validar' && args[0] != null && args[1] != null) {
        const valid = await db.query('select valid from users where discord_id = $1', [message.member.id]);
        if (valid.rows[0].valid == true){
            return message.channel.send('A sua conta já está validada!');
        }

        const display_name = message.member.nickname.valueOf().split(' ');
        if (!args[0].split('@')[0].toLowerCase().startsWith('a') && !args[0].split('@')[0].toLowerCase().startsWith('p')) {
            return message.channel.send('O endereço de email tem de começar por a (alunos) ou p(professor)!');
        }
        if (args[0].split('@')[1].toLowerCase() != 'alunos.ulht.pt' && args[0].split('@')[1].toLowerCase() != 'ulusofona.pt') {
            return message.channel.send('O endereço de email tem de conter um dos seguintes dominios alunos.ulht.pt ou ulusofona.pt.');
        }

        if (display_name.length != 3) {
            return message.channel.send('O teu apelido neste servidor não cumpre os requisitos, use aXXXXXX Nome Apelido! Ex: a21925372 Rui Silva');
        } else if (!display_name[0].toString().startsWith('a') && !display_name[0].toString().startsWith('p')) {
            return message.channel.send('O teu indicador tem de começar por "a" ou por "p"! Ex: a21925372 Rui Silva');
        }

        const userAccountN = await db.query('select count(*) from users where discord_id = $1 and code like $2 and student_number like $3', [message.member.id, args[1], display_name[0]]);
        if (userAccountN.rows[0].count == 1) {
            await db.query('update users set valid = $1,student_name = $2 where discord_id = $3', [true, message.member.nickname.valueOf(), message.member.id]);
            if (display_name[0].startsWith('p')) {
                message.member.roles.add(message.member.guild.roles.cache.find(role => role.name === "Docente"));
            } else if (display_name[0].startsWith('a')) {
                message.member.roles.add(message.member.guild.roles.cache.find(role => role.name === "Aluno"));
            }
            return message.channel.send('Conta validada com sucesso!');
        } else {
            return message.channel.send('Ocorreu um erro ao validar a conta');
        }
    } else {
        //console.log("AGRS " + args.length + " | " + args);
        return message.channel.send('Para utilizares este comando usa um destes exemplos:\n' +
            '!validar <aXXXXXX> - Para enviar/reenviar o código para o teu email.\n' +
            '!validar <aXXXXXX> <codigo> - Para validar a tua conta.');
    }
});


client.on("messageCreate", async message => {
    if (message.channel.type.includes("THREAD")) {
        console.log(message.channel);
        await db.query('insert into testes (uuid,message,server_id,discord_user_id) values ($1,$2,$3,$4)', [uuidv1(), message.content, message.member.guild.id, message.member.id]);
    }
});

client.on("threadListSync", async (threads) => {
    console.log("threadListSync " + threads);
});

client.on('threadCreate', async (thread) => {
    console.log(thread);
});

client.on("threadDelete", async (thread) => {
    console.log("threadDelete " + thread);
});

client.login(process.env.BOT_TOKEN);

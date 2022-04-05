require('dotenv').config();
var pjson = require('./package.json');
const {Client, Intents, TextChannel,ChannelTypes, GuildMemberManager} = require('discord.js');
const db = require('./database/_database');
var nodemailer = require('nodemailer');
const {v1: uuidv1} = require('uuid');

var bot_servers = [];
const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_INTEGRATIONS,
        Intents.FLAGS.GUILD_PRESENCES,
        Intents.FLAGS.GUILD_WEBHOOKS,
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'validacao.inf.ulht@gmail.com',
        pass: 'jpbktvcfmkycdzxc'
    }
});

let prefix = "!";
let bot_id = "904855826647379969";

async function validarAllUsers(){
    client.guilds.cache.forEach( async guild => {
        const list = client.guilds.cache.get(guild.id); 
        list.members.cache.forEach(async member => {
            if(member.user.id == bot_id){
                return;
            }
            const userAccountN = await db.query('select count(*) from users where discord_id = $1', [member.user.id]);
            if (userAccountN.rows[0].count == 0) {
                db.query('insert into users (uuid,discord_id,student_number,student_name,valid,code) values ($1,$2,$3,$4,$5,$6)', [uuidv1(), member.user.id, '', '', false, '']);
                console.log(`[USER SERVICE] Utilizador "${member.user.id}" - "${member.user.username}" registado com sucesso!`);
                member.roles.add(member.guild.roles.cache.find(role => role.name === "Não-Verificado"));
            }
        });
      });
}

client.on('ready', async () => {
    db.connect();
    console.log('\n\nBOT APOIO A U.Cs\nVersão: '+pjson.version+'\n'+
    'BOT Stauts: Online\n'+
    'WebServer Status: Online\n'+
    'Estou online nos seguintes servidores:');
    client.guilds.cache.forEach(guild => {
        console.log('' + guild.id + ' | ' + guild.name+'');
        bot_servers.push(guild.id);
      });
      console.log('\n');
    console.log('Processo de validação de utilizadores...');
    validarAllUsers();
});

client.on("messageCreate", async message => {
    if (message.author.bot) return;
    if(message.channel.type=='DM'){
        let uuid = uuidv1();
        let command = message.content.split(' ')[0];
        let server = message.content.split(' ')[1];
        let name = message.content.substring(message.content.split(' ')[0].length+1+message.content.split(' ')[1].length+1);
        if (server.length >0 && name.length >0 && command == '!config') {
            if (!bot_servers.includes(server)){
                return message.reply('O servidor ID "' + server + '" não se encontra disponível para configuração.');
            }
            const bd = await db.query('select uc_name from unidades_curriculares where server_id = $1', [server]);
            if(db != null && bd.rows.length>0){
                return message.reply('O servidor ID "' + server + '" Já se encontra registado com o nome "' + bd.rows[0].uc_name + '".');
            }
            await db.query('insert into unidades_curriculares (uuid,server_id,uc_name) values ($1,$2,$3)', [uuid,server,name]);
            return message.reply('Servidor ID ' + server + ' configurado com o nome ' + name + '!\nIdentificador único: ' + uuid);
        }else{
            return message.reply('Comando inválido, utilize !config <id server discord> <nome do servidor>.');
        }
    }
});
//primeira validação de user e criação de row na tabela users em BD
client.on("guildMemberAdd", async (member) => {
    const userAccountN = await db.query('select count(*) from users where discord_id = $1', [member.user.id]);
    if (userAccountN.rows[0].count == 0) {
        await db.query('insert into users (uuid,discord_id,student_number,student_name,valid,code) values ($1,$2,$3,$4,$5,$6)', [uuidv1(), member.user.id, '', '', false, '']);
        console.log(`[USER SERVICE] Utilizador "${member.user.id}" - "${member.user.username}" registado com sucesso!`);
        member.roles.add(member.guild.roles.cache.find(role => role.name === "Não-Verificado"));
    } else {
        const userAccount = await db.query('select student_number,valid from users where discord_id = $1', [member.user.id]);
        if (userAccount.rows[0].student_number.toString().startsWith('p') && userAccount.rows[0].valid === true) {
            console.log('[USER SERVICE] Grupo setado para o user ' + member.user.id + ' Docente.');
            member.roles.add(member.guild.roles.cache.find(role => role.name === "Docente"));
         
            await db.query('insert into users_unidades_curriculares (uuid,discord_user_id,discord_server_id) values ($1,$2,$3)', [uuidv1(), member.user.id,member.guild.id ]);
            console.log(`[USER SERVICE] Utilizador "${member.user.id}" associado ao discord server id "${member.guild.id}".`);
            
        } else if (userAccount.rows[0].student_number.toString().startsWith('a') && userAccount.rows[0].valid === true) {
            console.log('[USER SERVICE] Grupo setado para o user '+member.user.id+' Aluno.');
            member.roles.add(member.guild.roles.cache.find(role => role.name === "Aluno"));
        } else {
            console.log('[USER SERVICE] Grupo setado para o user ' + member.user.id + ' não validado.');
            member.roles.add(member.guild.roles.cache.find(role => role.name === "Não-Verificado"));
        }
    }
});

client.on("messageCreate", async message => {
    if (message.author.bot || !message.channel.guild) return;
    if (!message.content.startsWith(prefix)) return;

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
        const password = uuidv1();
        var mailOptionsAlunos = {
            from: 'validacao.inf.ulht@gmail.com',
            to: args[0],
            subject: 'Validação conta Discord',
            text: 'O seu código de validação para o Discord é ' + CodeUUID + '.'
        };

        var mailOptionsDocentes = {
            from: 'validacao.inf.ulht@gmail.com',
            to: args[0],
            subject: 'Validação conta Discord + Web',
            text: 'O seu código de validação para o Discord é ' + CodeUUID + '.\n'+
                'Para aceder à plataforma web use o seu email de registo como user e a seguinte password '+password+'.'
        };

        await db.query('update users set code = $1,student_number = $2,password=$3 where discord_id = $4', [CodeUUID, args[0].split('@')[0].toLowerCase(),password, message.member.id]);

        if(args[0].split('@')[0].toLowerCase().startsWith('a')){
            await transporter.sendMail(mailOptionsAlunos, function (error, info) {
                if (error) {
                    console.log('[EMAIL SERVICE] Error: ' + error);
                } else {
                    console.log('[EMAIL SERVICE] Email enviado: ' + info.response);
                }
            });
        }else if(args[0].split('@')[0].toLowerCase().startsWith('p')){
            await transporter.sendMail(mailOptionsDocentes, function (error, info) {
                if (error) {
                    console.log('[EMAIL SERVICE] Error: ' + error);
                } else {
                    console.log('[EMAIL SERVICE] Email enviado: ' + info.response);
                }
            });
        }

        return message.channel.send('Foi enviado um código para o teu email!\nAssim que receberes ' +
            'executa o comando !validar a<XXXXXX>@alunos.ulht.pt <codigo do email>');

    } else if (args.length == 2 && command == '!validar' && args[0] != null && args[1] != null) {
        const valid = await db.query('select valid from users where discord_id = $1', [message.member.id]);
        if (valid.rows[0].valid == true){
            return message.channel.send('A sua conta já está validada!');
        }

        var display_name = "";

        if(message.member.nickname == null) {
            display_name = message.member.user.username.valueOf().split(' ');
        } else {
            display_name = message.member.nickname.valueOf().split(' ');
        }

        if (!args[0].split('@')[0].toLowerCase().startsWith('a') && !args[0].split('@')[0].toLowerCase().startsWith('p')) {
            return message.channel.send('O endereço de email tem de começar por a (alunos) ou p(professor)!');
        }
        if (args[0].split('@')[1].toLowerCase() != 'alunos.ulht.pt' && args[0].split('@')[1].toLowerCase() != 'ulusofona.pt') {
            return message.channel.send('O endereço de email tem de conter um dos seguintes dominios alunos.ulht.pt ou ulusofona.pt.');
        }

        if (display_name.length != 3) {
            return message.channel.send('O teu apelido neste servidor não cumpre os requisitos, use aXXXXXX Nome Apelido! Ex: a21925372 Rui Silva');
        } else if (!display_name[0].toString().startsWith('a') && !display_name[0].toString().startsWith('p')) {
            return message.channel.send('O teu indicador tem de começar por "a" ou por "p"! Ex: a21925372 Rui Silva\nVolta a executar o comando !validar a<XXXXXX>@alunos.ulht.pt <codigo do email>');
        }

        const userAccountN = await db.query('select count(*) from users where discord_id = $1 and code like $2 and student_number like $3', [message.member.id, args[1], display_name[0]]);
        if (userAccountN.rows[0].count == 1) {
            if(message.member.nickname == null) {
                await db.query('update users set valid = $1,student_name = $2 where discord_id = $3', [true, message.member.user.username.valueOf(), message.member.id]);
            } else {
                await db.query('update users set valid = $1,student_name = $2 where discord_id = $3', [true, message.member.nickname.valueOf(), message.member.id]);
            }
            
            if (display_name[0].startsWith('p')) {
                message.member.roles.add(message.member.guild.roles.cache.find(role => role.name === "Docente"));
                console.log('[USER SERVICE] Grupo setado para o user ' + message.member.id + ' como Docente.');
            } else if (display_name[0].startsWith('a')) {
                message.member.roles.add(message.member.guild.roles.cache.find(role => role.name === "Aluno"));
                console.log('[USER SERVICE] Grupo setado para o user ' + message.member.id + ' como Aluno.');
            }
            console.log('[USER SERVICE] Conta validada para o user ' + message.member.id + '!');

            message.member.roles.remove(message.member.guild.roles.cache.find(role => role.name === "Não-Verificado"));

            return message.channel.send('Conta validada com sucesso!');
        } else {
            return message.channel.send('Ocorreu um erro ao validar a conta');
        }
    } else {
        
        if(!args.split(' ').length > 3) {
            return message.channel.send('O comando que acabou de executar tem informação a mais, você só necessita de fazer \"!validar <e-mail institucional> <código de validação>\"')
        }

        //console.log("AGRS " + args.length + " | " + args);
        return message.channel.send('Para utilizares este comando usa um destes exemplos:\n' +
            '!validar a<XXXXXX>@aluhos.ulht.pt - Para enviar/reenviar o código para o teu email.\n' +
            '!validar a<XXXXXX>@alunos.ulht.pt <codigo> - Para validar a tua conta.');
    }
});

client.on('messageReactionAdd', async (reaction, user) => {
    const bd = await db.query('select student_number from users where discord_id = $1', [user.id]);
    if(!bd.rows[0].student_number.startsWith('p')){
        return reaction.remove();
    }else{
        if(reaction.emoji.name.valueOf().includes("🏅")){
            console.log('[RANKING] Um utilizador (' + user.id + ') votou na mensagem '+reaction.message.id+ ' com 🏅!');
            await db.query('update threads_interactions set good_message = $1 where discord_message_id = $2', [true, reaction.message.id]);
        }
    }
});

client.on('messageReactionRemove', async (reaction, user) => {
    const bd = await db.query('select student_number from users where discord_id = $1', [user.id]);
    if(reaction.emoji.name.valueOf().includes("🏅")){
        console.log('[RANKING] Um utilizador (' + user.id + ') removeu 🏅 na mensagem ' + reaction.message.id + '!');
        await db.query('update threads_interactions set good_message = $1 where discord_message_id = $2', [false, reaction.message.id]);
    }
});

client.on("messageCreate", async message => {
    if (message.channel.type.includes("THREAD") && !message.type.includes("CHANNEL_NAME_CHANGE")) {
        const uuid = uuidv1();
        console.log('[THREADS] Nova interação numa thread, Discord ID: '+message.member.guild.id+' DB unique ID: '+uuid+' Mensagem: '+ message.content);
        await db.query('insert into threads_interactions (uuid,discord_message_id,discord_user_id,thread_id,message,discord_server_id,good_message,created_at) values ($1,$2,$3,$4,$5,$6,$7,$8)', 
        [uuidv1(),message.id,message.member.id, message.channelId.valueOf(),message.content, message.member.guild.id,false,null]);
       }
});

client.on('threadCreate', async (thread) => {
    const uuid = uuidv1();
    console.log('[THREADS] Nova questão iniciada Discord ID: ' + thread.guild.id + ' DB unique ID: ' + uuid + ' Titulo: ' + thread.name.valueOf());
    await db.query('insert into students_threads (uuid,discord_user_id,title,thread_id,discord_server_id,created_at) values ($1,$2,$3,$4,$5,$6)',
    [uuid, thread.ownerId, thread.name.valueOf(),thread.id.valueOf(),thread.guild.id,null]);

});

client.login(process.env.BOT_TOKEN);
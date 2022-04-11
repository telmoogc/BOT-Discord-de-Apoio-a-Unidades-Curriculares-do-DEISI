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
let bot_id = "904855826647379969"; // Ver se da para meter isto na ENV
const timeToDelete = 60000; //60s para apagar mensagens do bot + user

async function sendMessage(message, text){
    message.channel.send(text).catch('[ERRO] Detectado no reply de mensagens! ' + console.error).then(msg => {
        timer = setTimeout(() => {
            message.channel.messages
            .fetch(message.id)
            .then((fetchedMessage) => {

              fetchedMessage
                .delete()
                .catch((err) => console.log('[ERRO] Não foi possível apagar esta mensagem: ' + err, err));
            })
            .catch((err) => {
              if (err.httpStatus === 404) {
                console.log('[ERRO] Um utilizador já apagou esta mensagem antes do bot apagar!');
              } else {
                console.log(err);
              }
            });
            msg.delete()}, timeToDelete);
      });
}

async function validarAllUsers(){
    client.guilds.cache.forEach( async guild => {
        const list = client.guilds.cache.get(guild.id); 
        list.members.cache.forEach(async member => {
            if(member.user.id == bot_id){
                return;
            }

            const userAccountN = await db.query('select count(*) from users where discord_id = $1', [member.user.id]);
            if (userAccountN.rows[0].count == 0) {
                db.query('insert into users (uuid,discord_id,user_number,user_name,valid,code) values ($1,$2,$3,$4,$5,$6)', [uuidv1(), member.user.id, '', '', false, '']);
                console.log(`[USER SERVICE] Utilizador " ${member.user.id} " - " ${member.user.username} " registado com sucesso!`);
                member.roles.add(member.guild.roles.cache.find(role => role.name === "Não-Verificado"));
            }
        });
      });
}

async function checkNotVerifyedUsers(){
    var today = new Date();
    var date = today.getDate() + '/' + (today.getMonth() + 1) + '/' + today.getFullYear();
    let messageToSend = '\nUpdate validação ' + date + '\n' + 'Os seguintes utilizadores ainda não concluiram o processo de validação:\n\n';
    const checkJob = await db.query('select count(*) from jobs where name = $1 and date = $2', ['USERS_NOT_VERIFY', date]);
    if (checkJob.rows[0].count == 0) {
        const usersNotVerify = await db.query('select discord_id  from users where valid = false;');
        if (usersNotVerify.rows.count != 0) {
            usersNotVerify.rows.forEach(user_id => {
                messageToSend += '<@' + user_id.discord_id + '>\n';
            });
            messageToSend += '\n\n> Caso já tenham o código enviado para o email, mudem o vosso nickname no servidor para o seguinte formato: <aXXXXXXX> <Primeiro Nome> <Segundo Nome>;\n';
            messageToSend += '> Se ainda não iniciaram o processo usem !validar para saber mais;';
            
            client.guilds.cache.forEach( async guild => {
                var list = client.guilds.cache.get(guild.id); 
                list.channels.cache.forEach(async canal =>{
                    if(canal.name == 'validação'){
                        canal.send(messageToSend);
                    }
                });
            });
            db.query('insert into jobs (uuid,name,description,date) values ($1,$2,$3,$4)', [uuidv1(), 'USERS_NOT_VERIFY', messageToSend, date]);
        }
    }
}

async function setGroupUser(member){
    const userAccountN = await db.query('select count(*) from users where discord_id = $1', [member.user.id]);
    if (userAccountN.rows[0].count == 0) {
        await db.query('insert into users (uuid,discord_id,user_number,user_name,valid,code) values ($1,$2,$3,$4,$5,$6)', [uuidv1(), member.user.id, '', '', false, '']);
        console.log(`[USER SERVICE] Utilizador " ${member.user.id} " - " ${member.user.username} " registado com sucesso!`);
        member.roles.add(member.guild.roles.cache.find(role => role.name === "Não-Verificado"));
    } else {
        const userAccount = await db.query('select user_number,valid from users where discord_id = $1', [member.user.id]);
        if (userAccount.rows[0].user_number.toString().startsWith('p') && userAccount.rows[0].valid === true) {
            console.log('[USER SERVICE] Grupo setado para o user ' + member.user.id + ' Docente.');
            member.roles.add(member.guild.roles.cache.find(role => role.name === "Docente"));
         
            await db.query('insert into users_unidades_curriculares (uuid,discord_user_id,discord_server_id) values ($1,$2,$3)', [uuidv1(), member.user.id,member.guild.id]);
            console.log(`[USER SERVICE] Utilizador " ${member.user.id} " associado ao discord server id " ${member.guild.id} ".`);
            
        } else if (userAccount.rows[0].user_number.toString().startsWith('a') && userAccount.rows[0].valid === true) {
            console.log('[USER SERVICE] Grupo setado para o user ' + member.user.id + ' Aluno.');
            member.roles.add(member.guild.roles.cache.find(role => role.name === "Aluno"));
        } else {
            console.log('[USER SERVICE] Grupo setado para o user ' + member.user.id + ' não validado.');
            member.roles.add(member.guild.roles.cache.find(role => role.name === "Não-Verificado"));
        }
    }
}


client.on('ready', async () => {
   await db.connect();
    console.log('\n\nBOT APOIO A U.Cs\nVersão: '+pjson.version+'\n'+
    'BOT Stauts: Online\n'+
    'WebServer Status: Online\n'+
    'Estou online nos seguintes servidores:');
    for (let guild of client.guilds.cache.values()) {
        bot_servers.push(guild.id);
        const dbserver = await db.query('select count(*) from unidades_curriculares where server_id = $1', [guild.id]);
        if (dbserver.rows[0].count == 0) {
            let uuid = uuidv1();
            await db.query('insert into unidades_curriculares (uuid,server_id,uc_name) values ($1,$2,$3)', [uuid,guild.id,guild.name]);
            console.log('[NOVO | ADICIONADO] ' + guild.id + ' | ' + guild.name+'');
        }else{
            console.log('[REGISTADO] ' + guild.id + ' | ' + guild.name + '');
        }
      };
    console.log('\n');
    console.log('Processo de validação de utilizadores...');
    validarAllUsers();
    checkNotVerifyedUsers();
});

//bot entra num servidor: verificar users e registar + setar grupo ||| bot registar server na tabela das ucs
client.on("guildCreate", async (guild) => {
    bot_servers.push(guild.id);
    const dbserver = await db.query('select count(*) from unidades_curriculares where server_id = $1', [guild.id]);
    if (dbserver.rows[0].count == 0) {
        let uuid = uuidv1();
        await db.query('insert into unidades_curriculares (uuid,server_id,uc_name) values ($1,$2,$3)', [uuid,guild.id,guild.name]);
        console.log('[NOVO | ADICIONADO] ' + guild.id + ' | ' + guild.name + '');
    }

    //validar os users quando o bot entra depois deles:
    const list = client.guilds.cache.get(guild.id); 
    list.members.cache.forEach(async member => {
        setGroupUser(member);
    });
})

//bot remove servidor das ucs e toda a informação guardada ????
client.on("guildDelete", guild => {
    console.log("Bot saiu de um servidor: " + guild.id);
})

client.on("messageCreate", async message => {
    if (message.author.bot) return;
    /*

    DESCONTINUADO - AGORA VALIDA NO ARRAQUE OU NA ENTRADA NUM NOVO SERVIDOR

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
    }*/
});



//primeira validação de user e criação de row na tabela users em BD
client.on("guildMemberAdd", async (member) => {
   setGroupUser(member);
   //falta setar o nickname
});

client.on("messageCreate", async message => {
    if (message.author.bot || !message.channel.guild) return;
    if (!message.content.startsWith(prefix)) return;

    //processo de validação de user DC e numero de aluno
    let args = message.content.split(' ');
    let command = args.shift().toLowerCase();
    if(command == '!apagar'){
        const newChannel = await message.channel.clone();
        console.log(newChannel.id);
        message.channel.delete();
        return message.reply('Mensagens apagadas!');
    }

    if (args.length == 1 && command == '!validar' && args[0] != null && args[1] == null) {
        const valid = await db.query('select valid from users where discord_id = $1', [message.member.id]);
        if (valid.rows[0].valid == true){
            return sendMessage(message,'A sua conta já está validada!');
        }

        if (!args[0].split('@')[0].toLowerCase().startsWith('a') && !args[0].split('@')[0].toLowerCase().startsWith('p')) {
            return sendMessage(message,'O endereço de email tem de começar por a (alunos) ou p(professor)!');
        }

        if (args[0].split('@').length!= 2 || args[0].split('@')[1].toLowerCase() != 'alunos.ulht.pt' && args[0].split('@')[1].toLowerCase() != 'ulusofona.pt') {
            return sendMessage(message,'O endereço de email tem de conter um dos seguintes dominios alunos.ulht.pt ou ulusofona.pt.');
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
                'Para aceder à plataforma web use o seu email de registo como user e a seguinte password ' + password + '.'
        };

        await db.query('update users set code = $1,user_number = $2,password=$3 where discord_id = $4', [CodeUUID, args[0].split('@')[0].toLowerCase(), password, message.member.id]);

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

        return sendMessage(message, 'Foi enviado um código para o teu email!\nAssim que receberes executa o comando !validar a<XXXXXX>@alunos.ulht.pt <codigo do email>');

    } else if (args.length == 2 && command == '!validar' && args[0] != null && args[1] != null) {
        const valid = await db.query('select valid from users where discord_id = $1', [message.member.id]);
        if (valid.rows[0].valid == true){
            return sendMessage(message,'A sua conta já está validada!');
        }

        var display_name = "";

        if(message.member.nickname == null) {
            display_name = message.member.user.username.valueOf().split(' ');
        } else {
            display_name = message.member.nickname.valueOf().split(' ');
        }

        if (!args[0].split('@')[0].toLowerCase().startsWith('a') && !args[0].split('@')[0].toLowerCase().startsWith('p')) {
            return sendMessage(message,'O endereço de email tem de começar por a (alunos) ou p(professor)!');
        }

        if (args[0].split('@').length!= 2 || args[0].split('@')[1].toLowerCase() != 'alunos.ulht.pt' && args[0].split('@')[1].toLowerCase() != 'ulusofona.pt') {
            return sendMessage(message,'O endereço de email tem de conter um dos seguintes dominios alunos.ulht.pt ou ulusofona.pt.');
        }

        if (display_name.length != 3) {
            return sendMessage(message,'O teu apelido neste servidor não cumpre os requisitos, use aXXXXXX Nome Apelido! Ex: a21925372 Rui Silva');
        } else if (!display_name[0].toString().startsWith('a') && !display_name[0].toString().startsWith('p')) {
            return sendMessage(message,'O teu indicador tem de começar por "a" ou por "p"! Ex: a21925372 Rui Silva\nVolta a executar o comando !validar a<XXXXXX>@alunos.ulht.pt <codigo do email>');
        }

        const userAccountN = await db.query('select count(*) from users where discord_id = $1 and code like $2 and user_number like $3', [message.member.id, args[1], display_name[0]]);
        if (userAccountN.rows[0].count == 1) {
            
            if(message.member.nickname == null) {
                await db.query('update users set valid = $1,user_name = $2 where discord_id = $3', [true, message.member.user.username.valueOf(), message.member.id]);
            } else {
                await db.query('update users set valid = $1,user_name = $2 where discord_id = $3', [true, message.member.nickname.valueOf(), message.member.id]);
            }
            
            if (display_name[0].startsWith('p')) {
                message.member.roles.add(message.member.guild.roles.cache.find(role => role.name === "Docente"));
                console.log('[USER SERVICE] Grupo setado para o user ' + message.member.id + ' como Docente.');
                
                //associar docente (que entrou neste discord) ao painel de gestão
                await db.query('insert into users_unidades_curriculares (uuid,discord_user_id,discord_server_id) values ($1,$2,$3)', [uuidv1(),message.member.id,message.member.guild.id]);
            
            } else if (display_name[0].startsWith('a')) {
                message.member.roles.add(message.member.guild.roles.cache.find(role => role.name === "Aluno"));
                console.log('[USER SERVICE] Grupo setado para o user ' + message.member.id + ' como Aluno.');
            }
            console.log('[USER SERVICE] Conta validada para o user ' + message.member.id + '!');

            message.member.roles.remove(message.member.guild.roles.cache.find(role => role.name === "Não-Verificado"));
            return sendMessage(message,'Conta validada com sucesso!');
        } else {
            return sendMessage(message,'Ocorreu um erro ao validar a conta');
        }
    } else {
        
        if(!args.length > 3) {
            return sendMessage(message, 'O comando que acabou de executar tem informação a mais, você só necessita de fazer \"!validar <e-mail institucional> <código de validação>\"');
        }

        //console.log("AGRS " + args.length + " | " + args);
        return sendMessage(message,'Para utilizares este comando usa um destes exemplos:\n' +
            '!validar a<XXXXXX>@aluhos.ulht.pt - Para enviar/reenviar o código para o teu email.\n' +
            '!validar a<XXXXXX>@alunos.ulht.pt <codigo> - Para validar a tua conta.');
    }
});

client.on('messageReactionAdd', async (reaction, user) => {
    const bd = await db.query('select user_number from users where discord_id = $1', [user.id]);
    if(!bd.rows[0].user_number.startsWith('p')){
        return reaction.users.remove(user.id);
    }else{
        if(reaction.emoji.name.valueOf().includes("🏅")){
            console.log('[RANKING] Um utilizador (' + user.id + ') votou na mensagem ' + reaction.message.id + ' com 🏅!');
            await db.query('update threads_interactions set good_message = $1 where discord_message_id = $2', [true, reaction.message.id]);
        }else if(reaction.emoji.name.valueOf().includes("🏆")){
            const isQuestion = await db.query('select discord_message_id from threads_interactions ti  where thread_id = $1 order by discord_message_id limit 1;', [reaction.message.channel.id]);
            if (isQuestion.rows[0].discord_message_id != reaction.message.id){
                sendMessage(reaction.message,'Apenas pode marcar a primeira mensagem da thread como boa questão!');
                return reaction.users.remove(user.id);
            }
            console.log('[RANKING] Um utilizador (' + user.id + ') votou na mensagem ' + reaction.message.id + ' com 🏆!');
            await db.query('update students_threads set good_thread = $1 where thread_id = $2', [true, reaction.message.channel.id]);
        }
    }
});

client.on('messageReactionRemove', async (reaction, user) => {
    const bd = await db.query('select user_number from users where discord_id = $1', [user.id]);
    if(reaction.emoji.name.valueOf().includes("🏅")){
        console.log('[RANKING] Um utilizador (' + user.id + ') removeu 🏅 na mensagem ' + reaction.message.id + '!');
        await db.query('update threads_interactions set good_message = $1 where discord_message_id = $2', [false, reaction.message.id]);
    }else if(reaction.emoji.name.valueOf().includes("🏆")){
        console.log('[RANKING] Um utilizador (' + user.id + ') removeu 🏆 na mensagem ' + reaction.message.id + '!');
        await db.query('update students_threads set good_thread = $1 where thread_id = $2', [false, reaction.message.channel.id]);
    }
});

client.on("messageCreate", async message => {
    if (message.channel.type.includes("THREAD") && !message.type.includes("CHANNEL_NAME_CHANGE") && message.author.id != bot_id) {
        const uuid = uuidv1();
        console.log('[THREADS] Nova interação numa thread, Discord ID: ' + message.member.guild.id + ' DB unique ID: ' + uuid + ' Mensagem: ' + message.content);
        await db.query('insert into threads_interactions (uuid,discord_message_id,discord_user_id,thread_id,message,discord_server_id,good_message,created_at) values ($1,$2,$3,$4,$5,$6,$7,$8)', 
        [uuidv1(),message.id,message.member.id, message.channelId.valueOf(), message.content, message.member.guild.id, false, null]);
       }
});

client.on('threadCreate', async (thread) => {
    const uuid = uuidv1();
    console.log('[THREADS] Nova questão iniciada Discord ID: ' + thread.guild.id + ' DB unique ID: ' + uuid + ' Titulo: ' + thread.name.valueOf());
    await db.query('insert into students_threads (uuid,discord_user_id,title,thread_id,discord_server_id,created_at) values ($1,$2,$3,$4,$5,$6)', 
    [uuid, thread.ownerId, thread.name.valueOf(),thread.id.valueOf(),thread.guild.id,null]);
});

client.on("messageDelete", async function(message){
    //se for uma thread e for apagada a mensagem seta a flag deleted = 1
    if (message.channel.type.includes("THREAD")) {
        console.log('[THREADS] Mensagem apagada de uma tread, apagada por: ' + message);
        await db.query('update threads_interactions set deleted = $1 where discord_message_id = $2', [true,message.id]);
    }
});

client.on('threadDelete', async (thread) => {
    console.log('[THREADS] Uma Thread foi apagada, apagada por: ' + thread);
    await db.query('update students_threads set deleted = $1 where thread_id = $2', [true,thread.id]);
});


client.on("messageCreate", async message => {
    if (message.author.bot) return;
    if(message.channel.type=='DM'){
        let command = message.content.split(' ')[0];
        if (command == '!anon') {
        }
    }
});


client.login(process.env.BOT_TOKEN);
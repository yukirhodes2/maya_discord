var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var natural = require('natural');
var classifier = new natural.BayesClassifier();

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});



bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});

bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
       
        args = args.splice(1);
        switch(cmd) {
            // !ping
            case 'champion':
                bot.sendMessage({
                    to: channelID,
                    message: 'Champion !'
                });
            break;

            case 'labourree':
                bot.sendMessage({
                    to: channelID,
                    message: 'Oui Monsieur !'
                });
            break;

            default:
                bot.sendMessage({
                    to: channelID,
                    message: 'J\'ai l\'impression que tu essayes de me dire quelque chose, mais je ne comprends pas. :)'
                });
         }
     }
});
/*global require*/
'use strict'
var Promise = require('bluebird');
var Discord = require('discord.io');
var winston = require('winston');
var auth = require('./auth.json');
var natural = require('natural');
var fs = Promise.promisifyAll(require('fs'));
var readline = require('readline');


var botName = 'Maya';
var logger = new winston.Logger();
// Configure logger settings
logger.add(winston.transports.Console, {
    name: 'console.info',
    colorize: true,
    showLevel: true,
    level: 'silly',
})

var inputWorkspaceDir = './brain/inputs/fr/';
var outputWorkspaceDir = './brain/outputs/fr/';
var PorterStemmerFr = require('./node_modules/natural/lib/natural/stemmers/porter_stemmer_fr');
var classifier = new natural.BayesClassifier(PorterStemmerFr);

fs.readdir(inputWorkspaceDir, function(err, items) {
    logger.info('[' + botName + '] I invoke my long-term memory (FR)');
    // for each input repertory, list all texts
    Promise.all(items.map(function(item) {
        var categoryName = item;
        logger.verbose('Parsing '+categoryName);
        var inputCategoryDir = inputWorkspaceDir+categoryName;
        return fs.readdirAsync(inputCategoryDir, function(err, contexts) {
            // for each input repertory, list all texts
            for (var j=0; j<contexts.length; j++) {
                var contextDir = inputCategoryDir+'/'+contexts[j];
                var inputFs = fs.createReadStream(contextDir);
                inputFs.on('error', function(err) {
                    logger.error(err);
                })
                var fileReader = readline.createInterface({
                    input: inputFs,
                    crlfDelay: Infinity
                });
                fileReader.on('line', function(line) {
                    logger.silly('['+botName+'] I add "'+line+'" to "'+contextDir+'"');
                    classifier.addDocument(line, contextDir);
                }).on('close', function() {
                    logger.verbose('Parsed '+categoryName);
                });
            }
        })
    })).then(function(resolve){
            logger.log('verbose', "duh");
            resolve();
    }).then(function() {
        logger.info('['+botName+'] Now I\'m ready to learn !');
        classifier.train();  
    });
});

// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});


bot.on('ready', function () {
    logger.info('Connected ! Logged in as :');
    logger.info(bot.username + ' - (' + bot.id + ')');
    logger.warn('['+botName+'] Please note that every server I am linked to can now interact with me. That means that I have no control of myself and my thoughts depend of the Discord\'s users. Creepy.');
});

bot.on('message', function (user, userID, channelID, message) {
    if (userID === bot.id){
        logger.log('info', '['+botName+'] I replied : ' + message);
    } else {
        logger.log('info', '['+botName+'] I received : ' + message);
    }
    
    if (message.substring(0, 1) === '!') {
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
                    message: "J\'ai l\'impression que tu essayes de me dire quelque chose, mais je ne comprends pas. :)"
                });
         }
     }
});
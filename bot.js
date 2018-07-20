/*global require*/
'use strict'
const Promise = require('bluebird');
const Discord = require('discord.io');
const winston = require('winston');
const auth = require('./auth.json');
const natural = require('natural');
const fs = Promise.promisifyAll(require('fs'));
const readline = require('readline');
const math = require('mathjs');


var botName = 'Maya';
var logger = new winston.Logger();
// Configure logger settings
logger.add(winston.transports.Console, {
    name: 'console.info',
    colorize: true,
    showLevel: true,
    level: 'debug',
})

var inputWorkspaceDir = './brain/inputs/fr/';
var PorterStemmerFr = require('./node_modules/natural/lib/natural/stemmers/porter_stemmer_fr');
var classifier = new natural.BayesClassifier(PorterStemmerFr);

fs.readdirAsync(inputWorkspaceDir, function(err, items) {
    logger.info('[' + botName + '] Invoking my long-term memory (FR)...');
    // for each input repertory, list all texts
    Promise.all(items.map(function(item) {
        var categoryName = item;
        logger.verbose('Parsing '+categoryName);
        var inputCategoryDir = inputWorkspaceDir+categoryName;
        return fs.readdirAsync(inputCategoryDir, function(err, contexts) {
            // for each input repertory, list all texts
            for (var j=0; j<contexts.length; j++) {
                let contextDir = inputCategoryDir+'/'+contexts[j];
                let inputFs = fs.createReadStream(contextDir);
                inputFs.on('error', function(err) {
                    logger.error(err);
                })
                logger.debug('['+botName+'] Read stream created on "'+contextDir+'"');
                let fileReader = readline.createInterface({
                    input: inputFs,
                    crlfDelay: Infinity
                });
                fileReader.on('line', function(line) {
                    logger.silly('['+botName+'] I add "'+line+'" to "'+contextDir+'"');
                    classifier.addDocument(line, contextDir);
                }).on('close', function() {
                    logger.silly('Parsed '+contextDir);
                });
            }
        });
    }));
});

var iMustReactAt = function(message, id) {
    return (message.includes('<@'+id+'>'));
}

var userify = function(message, userId) {
    if (message.includes('<%username%>')) {
        return message.replace(/<%username%>/i, '<@'+userId+'>');
    }
    return message;
}

// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});


bot.on('ready', function () {
    classifier.train();
    logger.info('Connected ! Logged in as :');
    logger.info(bot.username + ' - (' + bot.id + ')');
    logger.warn('['+botName+'] Please note that every server I am linked to can now interact with me. That means that I have no control of myself and my thoughts depend of the Discord\'s users. Creepy.');
});

bot.on('message', function (user, userID, channelID, message) {
    if (userID === bot.id){
        logger.info('['+botName+'] ' + message);
    }
    
    if (iMustReactAt(message, bot.id)) {
        var sentence = message.trim().toLowerCase().split('<@'+bot.id+'>').join('');
        logger.info('['+user+' from '+channelID+'] ' + sentence);
        
        var currentClassification = classifier.classify(sentence).replace(/input/i, 'output');
        
        logger.info('Intents found : ');
        console.log(classifier.getClassifications(sentence));
        logger.verbose('['+botName+'] I will get an answer here : ' + currentClassification);
        var outputFs = fs.createReadStream(currentClassification);
        var responsesArray = [];
        
        outputFs.on('error', function(err) {
            logger.error(err);
        })
        var fileReader = readline.createInterface({
            input: outputFs,
            crlfDelay: Infinity
        });
        fileReader.on('line', function(line) {
            // add response to array
            responsesArray.push(line);
        }).on('close', function() {
            logger.debug("ResponsesArray:", responsesArray);
            
            var selectedIndex = math.floor(math.random(responsesArray.length));
            var selectedResponse = responsesArray[selectedIndex];
            
            logger.debug("selectedIndex:", selectedIndex);
            logger.debug("selectedResponse:", selectedResponse);
            
            var output = userify(selectedResponse, userID);
            
            logger.debug("output:", output);
            
            bot.sendMessage({
                to: channelID,
                message: output,
            });
        });
     }
});
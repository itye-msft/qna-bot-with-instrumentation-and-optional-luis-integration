//=========================================================
// A QNA maker bot with LUIS with LUIS, 
// sending advanced telemetry to Application Insights 
// using bot instrumentation.
//=========================================================

var restify = require('restify');
var builder = require('botbuilder');
var lodash = require('lodash');
var instrumentation = require('botbuilder-instrumentation');

var cognitiveservices = require('botbuilder-cognitiveservices');
var customQnAMakerTools = require('./CustomQnAMakerTools');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat bot
var connector = new builder.ChatConnector({
 appId: process.env.MICROSOFT_APP_ID,
 appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);

// Setting up advanced instrumentation telemtry to Application Insights
let advancedLogger = new instrumentation.BotFrameworkInstrumentation({ 
	instrumentationKey: process.env.APPINSIGHTS_INSTRUMENTATIONKEY,
	sentimentKey: process.env.CG_SENTIMENT_KEY
  });
// Start the telemtry logger
advancedLogger.monitor(bot);

server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================

// Setup the QNA Maker recognizer. Your QNA Maker SubscriptionKey and Knowledge Base ID can be obtained from https://qnamaker.ai/
var qna_recognizer = new cognitiveservices.QnAMakerRecognizer({
	knowledgeBaseId: process.env.QnA_knowledgeBaseId, 
	subscriptionKey: process.env.QnA_subscriptionKey,
	top: 4});

var qnaMakerTools = new cognitiveservices.QnAMakerTools();
bot.library(qnaMakerTools.createLibrary());

//Adding LUIS intents, you can obtain your LUIS model URL from https://www.luis.ai/
var model= process.env.QnA_LuisModel;
var luis_recognizer = new builder.LuisRecognizer(model);

// This line does the trick of combining 2 different recognizers in one bot.
// The responses from all recognizers are aggregated, and the top score result will be matched.
var qna_luis_dialog = new builder.IntentDialog({ recognizers: [qna_recognizer, luis_recognizer], intentThreshold:0.5 });

// For casual simple conversation reply with common answers
// Bot-builder instrumentation packages will automatically detect LUIS intent recognitions and will send it to the telemetry.
qna_luis_dialog.matches('Greetings', [
    function (session, args, next) {
		let userQuery = session.message.text;
		let score = args.score;
		let intent = args.intent;
		let answer = 'Hello :)';

		session.send(answer);
    }
]);
qna_luis_dialog.matches('Caring', [
    function (session, args, next) {
		let userQuery = session.message.text;
		let score = args.score;
		let intent = args.intent;
		let answer = 'I\'m fine thanks, hope you too.';

		session.send(answer);
    }
]);

// A response from the QNA service is matched as 'qna' automatically.
// We will have to process the QNA response, which is different than the LUIS response.
qna_luis_dialog.matches('qna', [
    function (session, args, next) {
		
		var answerEntity = builder.EntityRecognizer.findEntity(args.entities, 'answer');
		
		let userQuery = session.message.text;
		let kbAnswer = answerEntity.entity;
		let score = answerEntity.score;
		let kbQuestion = lodash.find(args.answers,(item)=>item.answer === kbAnswer).questions.join(",");

		//explicitly send the qna data to the telemetry
		sendTelemtry(session, userQuery, kbQuestion, kbAnswer, score);
		
        session.send(answerEntity.entity);
    }
]);

//Fallback, when no sufficient result arrvied from both the QNA service and LUIS service.
qna_luis_dialog.onDefault([
    function(session){
        session.send('Sorry! I don\'t understand');
	}
]);
	
bot.dialog('/', qna_luis_dialog);

//=========================================================
// Sending advanced telemetry
//=========================================================

var sendTelemtry = function (session, userQuery, kbQuestion, kbAnswer, score) {
	advancedLogger.trackQNAEvent(session, userQuery, kbQuestion, kbAnswer, score);
}
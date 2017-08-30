//=========================================================
// A QNA maker bot, 
// sending advanced telemetry to Application Insights 
// using bot instrumentation.
//=========================================================

var restify = require('restify');
var builder = require('botbuilder');
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

var recognizer = new cognitiveservices.QnAMakerRecognizer({
	knowledgeBaseId: process.env.QnA_knowledgeBaseId, 
	subscriptionKey: process.env.QnA_subscriptionKey,
	top: 4});

var qnaMakerTools = new cognitiveservices.QnAMakerTools();
bot.library(qnaMakerTools.createLibrary());
	
var basicQnAMakerDialog = new cognitiveservices.QnAMakerDialog({
	recognizers: [recognizer],
	defaultMessage: 'No match! Try changing the query terms!',
	qnaThreshold: 0.3,
	feedbackLib: qnaMakerTools
});

// Override to also include the knowledgebase question with the answer on confident matches
basicQnAMakerDialog.respondFromQnAMakerResult = function(session, qnaMakerResult){
	var result = qnaMakerResult;

	// You can customize the result to you needs.
	var response = 'Here is the match from FAQ:  \r\n  Q: ' + result.answers[0].questions[0] + '  \r\n A: ' + result.answers[0].answer;
	session.send(response);
}

// Overriding this function allows us access the full data of the matched Q&A before ending the dialog
basicQnAMakerDialog.defaultWaitNextMessage = function(session, qnaMakerResult){
	if(session.privateConversationData.qnaFeedbackUserQuestion != null && qnaMakerResult.answers != null && qnaMakerResult.answers.length > 0 
		&& qnaMakerResult.answers[0].questions != null && qnaMakerResult.answers[0].questions.length > 0 && qnaMakerResult.answers[0].answer != null){
			
			let userQuery = session.privateConversationData.qnaFeedbackUserQuestion;
            let kbQuestion = qnaMakerResult.answers[0].questions[0];
            let kbAnswer = qnaMakerResult.answers[0].answer;
            let score = qnaMakerResult.score;
			
			//explicitly send the qna data to the telemetry
            advancedLogger.trackQNAEvent(session, userQuery, kbQuestion, kbAnswer, score);

		}
	session.endDialog();
}

bot.dialog('/', basicQnAMakerDialog);

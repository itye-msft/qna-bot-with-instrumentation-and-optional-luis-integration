QnA Maker bot with instrumentation and optional LUIS integration
===========================
# Background

[Microsoft QnA Maker](https://qnamaker.ai/) is a free, easy-to-use, REST API and web-based service that trains AI to respond to user's questions in a more natural, conversational way. QnA Maker is primarily meant to provide a FAQ data source which you can query from your Bot/Application.

# The missing piece

Clients using the QnA Maker API with bots don’t have an out-of-the-box solution for viewing their insights, analytics and performance KPIs.

# Integrating with Ibex

[Ibex Project](https://github.com/CatalystCode/ibex-dashboard) will provide you a built in template for displaying all sort of insights, drill-downs to the conversation level, and important KPIs.Since Ibex is just reading information from Microsoft Application Insights API, it means your bot will have to send data to Application Insights in a custom schema which Ibex QnA template can read.

The correct telemetry scheme is sent using the “Bot Instrumentation” [NPM package](https://www.npmjs.com/package/botbuilder-instrumentation) for node.js or the [nugget package](https://www.nuget.org/packages/BotBuilder.Instrumentation) for C# and .net.

On top of the credentials needed to instantiate the [bot-instrumentation](https://github.com/CatalystCode/botbuilder-instrumentation), you will have to obtain your QNA Maker SubscriptionKey and Knowledge Base ID from https://qnamaker.ai/.

# You will find 2 code smaples:
1. [QnA Maker bot with instrumentation](https://github.com/itye-msft/qna-bot-with-instrumentation-and-optional-luis-integration/blob/master/app_qna.js) and telemetry sent to Application Insights.
2. [QnA Maker bot integrated with LUIS](https://github.com/itye-msft/qna-bot-with-instrumentation-and-optional-luis-integration/blob/master/app_qna_with_luis.js) as well in order to allow a more conversational experience for the user, and telemetry sent to Application Insights, which contains both the QnA results and LUIS intents.

## License
MIT
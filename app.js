var restify = require('restify');
var builder = require('botbuilder');

// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Create bot and bind to console
// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

// Create LUIS recognizer that points at our model and add it as the root '/' dialog for our Cortana Bot.
var model = 'https://api.projectoxford.ai/luis/v1/application?id=73cdee39-8bdb-4f38-a1f2-b01235297dad&subscription-key=dc48d86a9dd1425599532502a05df498';
var recognizer = new builder.LuisRecognizer(model);
var intents = new builder.IntentDialog({ recognizers: [recognizer] });
bot.dialog('/', intents);

// Add intent handlers
intents.matches('CreateVM', [
    function (session, args, next) {
        // Resolve and store any entities passed from LUIS.
        var vmType = builder.EntityRecognizer.findEntity(args.entities, 'VMType');
        var vm = session.dialogData.vm = {
          vmType: vmType ? vmType.entity : null
        };
        
        // Prompt for vmType
        if (!vm.vmType) {
            builder.Prompts.text(session, 'Windows or Linux?');
        } else {
            next();
        }
    },
    function (session, results, next) {
        var vm = session.dialogData.vm;
        if (results.response) {
            vm.vmType = results.response;
        }
        next();
    },
    function (session, results) {
        var baseUrl = 'https://azure.microsoft.com/en-us/documentation/services/virtual-machines/'
        session.send("Here's how to get started with %s virtual machines: " + baseUrl + "%s/", session.dialogData.vm.vmType, session.dialogData.vm.vmType);
    }
]);

intents.onDefault(builder.DialogAction.send("I'm sorry I didn't understand."));
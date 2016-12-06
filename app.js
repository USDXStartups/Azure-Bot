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

// Create AWS lookup table
var awsToAzure = {
    "ec2": "[Virtual Machines](https://docs.microsoft.com/en-us/azure/virtual-machines/)",
    "elastic block store": "[Page Blobs](https://docs.microsoft.com/en-us/azure/virtual-machines/virtual-machines-linux-about-disks-vhds?toc=%2fazure%2fvirtual-machines%2flinux%2ftoc.json) or [Premium Storage](https://azure.microsoft.com/en-us/services/storage/disks/)",
    "ebs": "[Page Blobs](https://docs.microsoft.com/en-us/azure/virtual-machines/virtual-machines-linux-about-disks-vhds?toc=%2fazure%2fvirtual-machines%2flinux%2ftoc.json) or [Premium Storage](https://azure.microsoft.com/en-us/services/storage/disks/)",
    "ec2 container service": "[Container Service](https://azure.microsoft.com/en-us/services/container-service/)",
    "lambda": "[Functions](https://docs.microsoft.com/en-us/azure/azure-functions/index)",
    "elastic beanstalk": "[Web Apps](https://azure.microsoft.com/en-us/services/app-service/web/)",
    "s3": "[Blob Storage](https://azure.microsoft.com/en-us/services/app-service/web/)",
    "elastic file system": "[File Storage](https://azure.microsoft.com/en-us/services/storage/files/)",
    "efs": "[File Storage](https://azure.microsoft.com/en-us/services/storage/files/)",
    "glacier": "[Backup](https://azure.microsoft.com/en-us/services/backup/) or [Blob Storage](https://azure.microsoft.com/en-us/services/storage/blobs/)",
    "storage gateway": "[StorSimple](https://azure.microsoft.com/en-us/services/storsimple/)",
    "cloudfront": "[Content Delivery Network](https://azure.microsoft.com/en-us/services/cdn/)",
    "vpc": "[Virtual Network](https://azure.microsoft.com/en-us/services/virtual-network/)",
    "virtual private cloud": "[Virtual Network](https://azure.microsoft.com/en-us/services/virtual-network/)",
    "route 53": "[DNS](https://azure.microsoft.com/en-us/services/dns/) or [Traffic Manager](https://azure.microsoft.com/en-us/services/traffic-manager/)",
    "direct connect": "[ExpressRoute](https://azure.microsoft.com/en-us/services/expressroute/)",
    "elastic load balancing": "[Load Balancer](https://azure.microsoft.com/en-us/services/load-balancer/) or [Application Gateway](https://azure.microsoft.com/en-us/services/application-gateway/)",
    "rds": "[SQL Database](https://azure.microsoft.com/en-us/services/sql-database/)",
    "dynamodb": "[DocumentDB](https://azure.microsoft.com/en-us/services/documentdb/)",
    "redshift": "[SQL Data Warehouse](https://azure.microsoft.com/en-us/services/sql-data-warehouse/)",
    "simpledb": "[Table Storage](https://azure.microsoft.com/en-us/services/storage/tables/)",
    "elasticache": "[Azure Redis Cache](https://azure.microsoft.com/en-us/services/cache/)",
    "data pipeline": "[Data Factory](https://azure.microsoft.com/en-us/services/data-factory/)",
    "kinesis": "[Event Hubs](https://azure.microsoft.com/en-us/services/event-hubs/), [Stream Analytics](https://azure.microsoft.com/en-us/services/stream-analytics/), or [Data Lake Analytics](https://azure.microsoft.com/en-us/services/data-lake-analytics/)",
    "simple notification service": "[Notification Hubs](https://azure.microsoft.com/en-us/services/notification-hubs/)"
}


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
        if (results.response.toLowerCase() === 'windows' || results.response.toLowerCase() === 'linux') {
            vm.vmType = results.response;
            next();
        } else {
            session.endDialog("I'm sorry, I don't know about %s virtual machines", results.response);
        }
        //next();
    },
    function (session, results) {
        var baseUrl = 'https://azure.microsoft.com/en-us/documentation/services/virtual-machines/'
        session.send("Here's how to get started with %s virtual machines: " + baseUrl + "%s/", session.dialogData.vm.vmType, session.dialogData.vm.vmType);
    }
]);

intents.matches('GetRegions', [
    function (session, args, next) {
        //TODO: Add location-specific logic.
        session.send("Azure currently has datacenters in the following locations:\nVirginia, Iowa, Illinois, Texas, California, Quebec City, Toronto, Sao Paulo State, Ireland, Netherlands, Frankfurt, Magdeburg, Cardiff, Singapore, Hong Kong, New South Wales, Victoria, Pune, Mumbai, Chennai, Tokyo, Osaka, Shanghai, Beijing, Seoul. For more info, see [Azure Regions](https://azure.microsoft.com/en-us/regions/)");
    }
]);

intents.matches('GetPricingInfo', [
    function (session, args, next) {
        //TODO: Add service-specific logic.
        session.send("To get a pricing estimate for your specific scenario, check out the Azure pricing calculator: https://azure.microsoft.com/en-us/pricing/calculator/");
    }
]);

intents.matches('GetStarted', [
    function (session, args, next) {
        //TODO: Add service-specific logic.
        session.send("Here are some resources to get you started: [Azure Documentation](https://docs.microsoft.com/en-us/azure/), [Azure for Startups GitHub Repository](https://github.com/Azure-for-Startups/Content/blob/master/README.md), [Get Started Guide for Azure Developers](https://opbuildstorageprod.blob.core.windows.net/output-pdf-files/en-us/guides/azure-developer-guide.pdf), [Azure Tools and SDKs](https://docs.microsoft.com/en-us/azure/#pivot=sdkstools)");
    }
]);

intents.matches('GetManagementInfo', [
    function (session, args, next) {
        session.send("You can create and manage your Azure services programmatically or through the [Azure Portal](portal.azure.com). If you're a Mac user, install the [Azure CLI](https://docs.microsoft.com/en-us/azure/xplat-cli-install), and for Windows, leverage [Azure Powershell commandlets](https://docs.microsoft.com/en-us/powershell/azureps-cmdlets-docs/).  Or if you want, call the REST APIs directly: [Azure REST SDK reference](https://docs.microsoft.com/en-us/rest/api/).  And finally, [Azure Resource Manager](https://docs.microsoft.com/en-us/azure/azure-resource-manager/resource-group-overview)...use this when you want a template-based deployment for all the things.  There's a bunch of [Quickstart templates](https://github.com/Azure/azure-quickstart-templates) already on GitHub that you can start with.");
    }
]);

intents.matches('GetAWSTranslation', [
    function (session, args, next) {
        var awsService = builder.EntityRecognizer.findEntity(args.entities, 'AWSService');

        var result = "";
        if (awsService) {
            var entity = awsService.entity;
            if (!(entity in awsToAzure)) {
                result = "Check out this [Azure and AWS](https://azure.microsoft.com/en-us/overview/azure-vs-aws/mapping/) chart where you can see what services map to what.";
            } else {
                result = "Look into " + awsToAzure[entity] + ". Also, here's a guide for translating [Azure and AWS](https://azure.microsoft.com/en-us/overview/azure-vs-aws/mapping/)."
            }
        } else {
            result = " Check out this [Azure and AWS](https://azure.microsoft.com/en-us/overview/azure-vs-aws/mapping/) chart where you can see what services map to what."
        }
        session.send(result);
    }
]);

intents.matches('None', [
    function (session, args, next) {
        session.send("I'm sorry I didn't understand.");
    }
]);

intents.onDefault(builder.DialogAction.send("I'm sorry I didn't understand."));
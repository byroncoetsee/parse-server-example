// Example express application adding the parse-server module to expose Parse
// compatible API routes.

var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');

var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}

var api = new ParseServer({
  databaseURI: databaseUri || 'mongodb://heroku_s172qkgq:k60iv8kj6p7r0371kg58thdair@ds059165.mlab.com:59165/heroku_s172qkgq',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || 'PANICING-TURTLE',
  masterKey: process.env.MASTER_KEY || 'PANICINGTURTLE3847TR386TB281XN1NY7YNXM', //Add your master key here. Keep it secret!
  serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',  // Don't forget to change to https if needed
  liveQuery: {
    classNames: ["Posts", "Comments"] // List of classes to support for query subscriptions
  },

  // Email verification and password reset
  verifyUserEmails: false,
  publicServerURL: 'https://panicing-turtle.herokuapp.com/parse',
  appName: 'Panicing Turtle',
  // emailAdapter: { 
  //   module: 'parse-server-simple-mailgun-adapter',
  //   options: { 
  //              fromAddress: 'byroncoetsee@gmail.com',
  //              domain: 'sandbox65d632eefe564d9e833b9cd1d045b0a1.mailgun.org', 
  //              apiKey: 'key-4053c4e2c0fa3476d9b6e414de6ff50c', 
  //            }
  //  },
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function(req, res) {
  res.status(200).send('I dream of being a website.  Please star the parse-server repo on GitHub!');
});

// There will be a test page available on the /test path of your server url
// Remove this before launching your app
app.get('/test', function(req, res) {
  res.sendFile(path.join(__dirname, '/public/test.html'));
});

var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('parse-server-example running on port ' + port + '.');
});

// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);



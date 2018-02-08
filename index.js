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
  databaseURI: databaseUri || 'mongodb://heroku_fm2lcg6l:mqr39cog9dhms035pb2akcocb7@ds157097.mlab.com:57097/heroku_fm2lcg6l',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || 'BLACKBOX-TURTLE',
  masterKey: process.env.MASTER_KEY || 'BLACKBOXTURTLE764TBDR3267TBCUY34GC7B', //Add your master key here. Keep it secret!
  serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',  // Don't forget to change to https if needed
  verbose: true,
  liveQuery: {
    classNames: ["Orders"] // List of classes to support for query subscriptions
  },
  push: {
    ios: {
      pfx : __dirname + "/PushNotification_Prod.p12",
      bundleId : "io.flyingmongoose.BlackBox-Coffee",
      production : false
    }
  },

  // Email verification and password reset
  verifyUserEmails: false,
});

var app = express();

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function(req, res) {
  res.status(200).send('BlackBox coffee, baby! ... Now stop snooping around and mind your own business :|');
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
var parseLiveQueryServer = ParseServer.createLiveQueryServer(httpServer);




Parse.Cloud.define('hello', function(req, res) {
  res.success('Hi');
});

Parse.Cloud.define('push', function(req, res) {
  var http = require("https");

  var options = {
    "method": "POST",
    "hostname": "fcm.googleapis.com",
    "port": null,
    "path": "/fcm/send",
    "headers": {
      "authorization": "key=AAAAiT43N9A:APA91bE-DrOG3GhiwvvzJGdlEBpFgpwHomp51n7ZNo8Bx-T4yHrdSIiCbE4MHkEHruC_jzcQ6tsYRfVS4jWYuSdd9_F6uU1_3jreYpmazsPXao7a0RjqO-UeWMa8StZeyxV1MuPVfpeX",
      "content-type": "application/json",
      "cache-control": "no-cache",
      "postman-token": "e79e9594-11a4-52b5-eb59-8bccb38943ad"
    }
  };

  var req = http.request(options, function (res) {
    var chunks = [];

    res.on("data", function (chunk) {
      chunks.push(chunk);
    });

    res.on("end", function () {
      var body = Buffer.concat(chunks);
      console.log(body.toString());
    });
  });

  req.write(JSON.stringify({ notification: { title: 'Portugal vs. Denmark', body: '5 to 1' },
    to: 'eZPuUJ8kJIk:APA91bHsDJ8Hss0xjWrdMplhDKWrfZoNyzJICWLAPgYvBbnArCN9r2ARiche7TYE1-2DhE5xSk343SDnpc4skzaHvAKr-SBbWPWOpc3UhH1Z9M_jN5MeCV4jOh7xiNGd6UTtxvNrAsRQ' }));
  req.end();
  res.success('Sent');
}

Parse.Cloud.job("cleanPanics", function(request, response) {
    var query = new Parse.Query("Panics");
    var d = new Date();
 
    query.equalTo("active", true);
    query.find({
        success: function(results) {
            for (var i = 0; i < results.length; i++) {
                if (results[i].updatedAt < (d.getTime() - (60 * 1000))) {
                results[i].set("active",false);// = true;
            }
          }
 
          Parse.Object.saveAll(results,{
            success: function(list) {
                  // All the objects were saved.
                  response.success("ok - updated: " + results.length);  //saveAll is now finished and we can properly exit with confidence :-)
                    }, error: function(error) {
                    // An error occurred while saving one of the objects.
                    response.error("failure on saving list ");
                  },});
          // response.success("sweet");
        }
    })
});

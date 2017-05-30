
Parse.Cloud.define('hello', function(req, res) {
  res.success('Hi');
});

Parse.Cloud.define("pushFromCloud", function(request, response) {
  Parse.Cloud.httpRequest({
      method: 'POST',
      url: 'https://fcm.googleapis.com/fcm/send',
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        'Authorization': 'key=AAAAiT43N9A:APA91bE-DrOG3GhiwvvzJGdlEBpFgpwHomp51n7ZNo8Bx-T4yHrdSIiCbE4MHkEHruC_jzcQ6tsYRfVS4jWYuSdd9_F6uU1_3jreYpmazsPXao7a0RjqO-UeWMa8StZeyxV1MuPVfpeX'
      },
      body: {
        notification: {
          title: 'Vote for Pedro',
          body: 'If you vote for Pedro, your wildest dreams will come true'
        },
        registration_ids: ['eZPuUJ8kJIk:APA91bHsDJ8Hss0xjWrdMplhDKWrfZoNyzJICWLAPgYvBbnArCN9r2ARiche7TYE1-2DhE5xSk343SDnpc4skzaHvAKr-SBbWPWOpc3UhH1Z9M_jN5MeCV4jOh7xiNGd6UTtxvNrAsRQ', 'eZPuUJ8kJIk:APA91bHsDJ8Hss0xjWrdMplhDKWrfZoNyzJICWLAPgYvBbnArCN9r2ARiche7TYE1-2DhE5xSk343SDnpc4skzaHvAKr-SBbWPWOpc3UhH1Z9M_jN5MeCV4jOh7xiNGd6UTtxvNrAsRQ', 'eZPuUJ8kJIk:APA91bHsDJ8Hss0xjWrdMplhDKWrfZoNyzJICWLAPgYvBbnArCN9r2ARiche7TYE1-2DhE5xSk343SDnpc4skzaHvAKr-SBbWPWOpc3UhH1Z9M_jN5MeCV4jOh7xiNGd6UTtxvNrAsRQ', 'eZPuUJ8kJIk:APA91bHsDJ8Hss0xjWrdMplhDKWrfZoNyzJICWLAPgYvBbnArCN9r2ARiche7TYE1-2DhE5xSk343SDnpc4skzaHvAKr-SBbWPWOpc3UhH1Z9M_jN5MeCV4jOh7xiNGd6UTtxvNrAsRQ']
      }
    }).then(function(httpResponse) {
      res.success('Sent!');
      console.log(httpResponse.text);
    }, function(httpResponse) {
      res.success('Failed');
      console.error('Request failed with response code ' + httpResponse.status);
  });
});

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

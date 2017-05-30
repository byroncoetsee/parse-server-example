
Parse.Cloud.define('hello', function(req, res) {
  res.success('Hi');
});

Parse.Cloud.define("pushFromCloud", function(request, response) {

  var channel = request.params.channel;
  var username = request.params.username;
  var contactNumber = request.params.contactNumber;


  // ========= fetching Firebase IDs
  var IDs = [];


  var query = new Parse.Query(Parse.Installation);
  query.notEqualTo("firebaseID", null);
  query.contains("channels", channel);
  query.find({
    useMasterKey: true,
    success: function(results) {

      for (var i = 0; i < results.length; ++i) {
        IDs.push(results[i].get("firebaseID"));
      }

      sendPush(IDs, username, contactNumber, response);

    },
    error: function() {
      response.error(error);
    }
  });
});

function sendPush(IDs, username, contactNumber, response) {
	Parse.Cloud.httpRequest({
      method: 'POST',
      url: 'https://fcm.googleapis.com/fcm/send',
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        'Authorization': 'key=AAAAiT43N9A:APA91bE-DrOG3GhiwvvzJGdlEBpFgpwHomp51n7ZNo8Bx-T4yHrdSIiCbE4MHkEHruC_jzcQ6tsYRfVS4jWYuSdd9_F6uU1_3jreYpmazsPXao7a0RjqO-UeWMa8StZeyxV1MuPVfpeX'
      },
      body: {
        notification: {
          title: username + ' needs your help!',
          body: 'Open the app to contact them (' + contactNumber + ') or to view their location on a map'
        },
        registration_ids: IDs
    }
    }).then(function(httpResponse) {
      response.success('Sent!');
    }, function(httpResponse) {
      response.error(error);
  });
};

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


var request;
var response;
var byronFirebaseId = "dpENNi2QB2o:APA91bHRNppdT4OY2MgUPiNDR2FqaYOKyHeUm9xiz6n0ruQ0lLL4iSF6jApA93UrzYdnTjaKnN9wi7kOpI252clDpFv59ojsy8NI1jbRj6Ob6GcgvJDKQCzA1Ywu-6HjP-yrf6PQyp8H";

Parse.Cloud.define("resetPassword", function(req, resp) {

  request = req
  response = resp

  var email = request.params.email;

  Parse.User.requestPasswordReset(email, {
    success: function() {
    // Password reset request was sent successfully
      finished("Please check your email for reset instructions.");
    },
    error: function(error) {
      // Show the error message somewhere
      finished(error.message);
      // alert("Error: " + error.code + " " + error.message);
    }
  });
});

Parse.Cloud.define("newAlertHook", function(req, resp) {

  request = req
  response = resp

  var panic = request.params.panic;
  var groups = request.params.groups;
  var user = request.params.user;

  var createdPanicGroups = "";
  //Create a Panic group record for each group
  for(var groupIndex = 0; groupIndex < groups.length; groupIndex++) {
    var object = new Parse.Object("PanicGroup");
    object.set("panic", panic);
    object.set("group", groups[groupIndex]);
    object.set("user", user);
    object.set("active", true);

    object.save(null, {
      success: function(object) {
        if(groupIndex == groups.length) 
          response.success("Created: " + createdPanicGroups);
        else
          createdPanicGroups += object.id + "\n";
      },
      error: function(object, error) {
        response.error("Failure on saving objects: " + error.getMessage());
      }
    });
  }
});

Parse.Cloud.define("getActiveAlerts", function(req, resp) {

  request = req
  response = resp

  var date = new Date();
  var groups = request.params.groups;

  //Query for each group provided
  for(var groupIndex = 0; groupIndex < groups.length; groupIndex++) {
    var query = new Parse.Query("PanicGroup");

    query.equalTo('group', groups[groupIndex]);
    query.equalTo('active', true);
    query.include('panic');
    query.include('user');

    query.find(
    {
      useMasterKey: true,
      success: function(results)
      {
        finished(results);
      },
      error: function()
       {
        response.error(error);
      }
    });
  }
});

Parse.Cloud.define("pushFromId", function(req, resp) {
  request = req
  response = resp

  var installationId = request.params.installationId
  var objectId = request.params.objectId;
  // finished(installationId);

  var query = new Parse.Query("Panics");
  query.equalTo('objectId', objectId);
  query.include('user');

  query.find({
    useMasterKey: true,
    success: function(result) {
      var panicObject = result[0]

      var user = getUser(panicObject)
      var groups = getGroups(user);
      var location = getLocation(panicObject);

      if (groups.length == 0) {
        response.error('No groups');
      }

      var groupsCheckedCounter = 0;

      var allIDs = {};

      // finished(groups[2].toLowerCase().replace(/\b\w/g, l => l.toUpperCase()).replace(/\s/g,''));

      for (var i = 0; i < groups.length; ++i) {
        getInstallationIDs(installationId, groups[i], function(IDs) {
          allIDs = Object.assign(allIDs, IDs);
          groupsCheckedCounter++;

          if (groupsCheckedCounter == groups.length) {
            finished(Object.keys(allIDs));
            var keys = Object.keys(allIDs);

            sendPush(keys, user, location, objectId);
          }
        });
      }

    },
    error: function() {
      response.error(error);
    }
  });
});

Parse.Cloud.afterSave("Messages", function(req) {
  request = req

  var name = request.displayName;
  var text = request.text;

  sendTestPush(name, text);
});

Parse.Cloud.define("sendTestPush", function(req, resp) {

  request = req
  response = resp

  var name = request.params.displayName;
  var text = request.params.text;

  sendTestPush(name, text);
});

function finished(something) {
  response.success(something);
}

function getIdsLazyArray(IDs) {

  return [];
}

function getUser(object) {
  return object.get('user');
}

function getGroups(user) {
  return user.get('groups');
}

function getLocation(object) {
  return object.get('location');
}

function getInstallationIDs(installationId, channel, callback) {

  var formattedChannel = channel.toLowerCase().replace(/\b\w/g, l => l.toUpperCase()).replace(/\s/g,'')
  var query = new Parse.Query(Parse.Installation);

  query.notEqualTo('objectId', installationId);
  query.notEqualTo('firebaseID', null);
  query.notEqualTo('allowNotifications', false);
  query.contains('channels', formattedChannel);
  query.find({
    useMasterKey: true,
    success: function(results) {
      var IDs = {};

      for (var i = 0; i < results.length; ++i) {
        IDs[results[i].get('firebaseID')] = '';
      }

      callback(IDs);
    },
    error: function() {
      response.error(error);
    }
  });
}

function sendPush(IDs, user, location, objectId) {

  var name = user.get('name');
  var number = user.get('cellNumber');

  var latitude = location['latitude'];
  var longitude = location['longitude'];


  Parse.Cloud.httpRequest({
      method: 'POST',
      url: 'https://fcm.googleapis.com/fcm/send',
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        'Authorization': 'key=AAAAiT43N9A:APA91bE-DrOG3GhiwvvzJGdlEBpFgpwHomp51n7ZNo8Bx-T4yHrdSIiCbE4MHkEHruC_jzcQ6tsYRfVS4jWYuSdd9_F6uU1_3jreYpmazsPXao7a0RjqO-UeWMa8StZeyxV1MuPVfpeX'
      },
      body: {
        "collapse_key": name,
        priority: 'high',
        notification: {
          title: name + ' needs your help!',
          body: 'Open the app to contact them (' + number + ') or to view their location on a map',
          icon: 'ic_stat_healing',
          sound: 'default'
        },
        data: {
          "lat": latitude,
          "lng": longitude,
          "objectId": objectId
        },
        registration_ids: IDs
    }
    }).then(function(httpResponse) {
      response.success('Sent!');
    }, function(httpResponse) {
      response.error(error);
  });
};

function sendTestPush(name, text) {
  Parse.Cloud.httpRequest({
      method: 'POST',
      url: 'https://fcm.googleapis.com/fcm/send',
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        'Authorization': 'key=AAAAiT43N9A:APA91bE-DrOG3GhiwvvzJGdlEBpFgpwHomp51n7ZNo8Bx-T4yHrdSIiCbE4MHkEHruC_jzcQ6tsYRfVS4jWYuSdd9_F6uU1_3jreYpmazsPXao7a0RjqO-UeWMa8StZeyxV1MuPVfpeX'
      },
      body: {
        notification: {
          title: name + ' ...',
          body: text + '====',
          sound: 'default'
        },
        'to': byronFirebaseId
      }
    }).then(function(httpResponse) {
      response.success('Sent test push!!!');
    }, function(httpResponse) {
      response.error(error);
  });
}


// ===============
// Parse Jobs
// ===============


Parse.Cloud.job("cleanPanics", function(request, response) {
    var query = new Parse.Query("Panics");
    var d = new Date();
    var numberOfHoursAgo = 24

 
    query.equalTo("active", true);
    query.lessThanOrEqualTo('updatedAt', new Date(d.getTime() - (60 * 60 * numberOfHoursAgo * 1000)));

    query.find({
      success: function(results) {

        // End if none found
        if (results.length == 0) { response.success('None found'); }

        for (var i = 0; i < results.length; i++) {
          results[i].set("active", false);
        }

        Parse.Object.saveAll(results,{
          success: function(list) {
            // All the objects were saved.
            response.success("Updated: " + results.length);  //saveAll is now finished and we can properly exit with confidence :-)
          },
          error: function(error) {
            // An error occurred while saving one of the objects.
            response.error("Failure on saving objects");
          },
        });
      },
      error: function(error) {
        response.error("Error on query.find: " + error);
      },
    });
});

Parse.Cloud.job("cleanPanicGroups", function(request, response) {
    var query = new Parse.Query("PanicGroup");
    var d = new Date();
    var numberOfHoursAgo = 24

 
    query.equalTo("active", true);
    query.lessThanOrEqualTo('updatedAt', new Date(d.getTime() - (60 * 60 * numberOfHoursAgo * 1000)));

    query.find({
      success: function(results) {

        // End if none found
        if (results.length == 0) { response.success('None found'); }

        for (var i = 0; i < results.length; i++) {
          results[i].set("active", false);
        }

        Parse.Object.saveAll(results,{
          success: function(list) {
            // All the objects were saved.
            response.success("Updated: " + results.length);  //saveAll is now finished and we can properly exit with confidence :-)
          },
          error: function(error) {
            // An error occurred while saving one of the objects.
            response.error("Failure on saving objects");
          },
        });
      },
      error: function(error) {
        response.error("Error on query.find: " + error);
      },
    });
});




// create intermediate table
// pointer to Panic and Group 
// Query where Group.objectId= and updatedAt=
// Check for Active state 
// return list


var request;
var response;

Parse.Cloud.define("newAlertHook", function(req, resp) {

  request = req
  response = resp

  var panic = request.params.panic;
  var group = request.params.group;
  var user = request.params.user;

  var object = new Parse.Object("PanicGroup");
  object.set("panic", panic);
  object.set("group", group);
  object.set("user", user);

  finished("ysy");

  object.save(null, {
    success: function(object) {
      response.success("Updated: " + object);
    },
    error: function(object, error) {
      response.error("Failure on saving objects");
    }
  });
});


Parse.Cloud.define("getActiveAlerts", function(req, resp) {

  request = req
  response = resp

  var query = new Parse.Query("PanicGroup");

  query.equalTo('group', request.params.group);
  query.notEqualTo('user', null);

  // query.include('user');

  query.find({
    useMasterKey: true,
    success: function(result) {

      // finished(result);
      finished("yyay");
      // var panicObject = result[0]

      // var user = getUser(panicObject)
      // var groups = getGroups(user);
      // var location = getLocation(panicObject);

      // if (groups.length == 0) {
      //   response.error('No groups');
      // }

      // var groupsCheckedCounter = 0;

      // var allIDs = {};

      // finished(groups[2].toLowerCase().replace(/\b\w/g, l => l.toUpperCase()).replace(/\s/g,''));

      // for (var i = 0; i < groups.length; ++i) {
      //   getInstallationIDs(installationId, groups[i], function(IDs) {
      //     allIDs = Object.assign(allIDs, IDs);
      //     groupsCheckedCounter++;

      //     if (groupsCheckedCounter == groups.length) {
      //       finished(Object.keys(allIDs));
      //       var keys = Object.keys(allIDs);

      //       sendPush(keys, user, location, objectId);
      //     }
      //   });
      // }

    },
    error: function() {
      response.error(error);
    }
  });
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


// ===============
// Parse functions
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




// create intermediate table
// pointer to Panic and Group 
// Query where Group.objectId= and updatedAt=
// Check for Active state 
// return list


var request;
var response;

Parse.Cloud.define("pushFromId", function(req, resp) {
  request = req
  response = resp

  var objectId = request.params.objectId;
  // finished(objectId);

  var query = new Parse.Query("Panics");
  query.equalTo('objectId', objectId);
  query.include('user');

  query.find({
    useMasterKey: true,
    success: function(result) {
      var panicObject = result[0]

      // finished(panicObject);

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
        getInstallationIDs(groups[i], function(IDs) {
          allIDs = Object.assign(allIDs, IDs);
          groupsCheckedCounter++;

          if (groupsCheckedCounter == groups.length) {
            finished(Object.keys(allIDs));
            var keys = Object.keys(allIDs);
            sendPush(keys, user, location);
          }
        });
      }

    },
    error: function() {
      response.error(error);
    }
  });
});

function finished(IDs) {
  response.success(IDs);
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

function getInstallationIDs(channel, callback) {

  var formattedChannel = channel.toLowerCase().replace(/\b\w/g, l => l.toUpperCase()).replace(/\s/g,'')
  var query = new Parse.Query(Parse.Installation);

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

function sendPush(IDs, user, location) {

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
        notification: {
          title: name + ' needs your help!',
          body: 'Open the app to contact them (' + number + ') or to view their location on a map'
        },
        data: {
          lat: latitude,
          lng: longitude
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
 
    query.equalTo("active", true);
    query.find({
      success: function(results) {

        for (var i = 0; i < results.length; i++) {
          if (results[i].updatedAt < (d.getTime() - (60 * 60 * 24 * 1000))) {
            results[i].set("active",false);// = true;
          }
        }

        Parse.Object.saveAll(results,{
          success: function(list) {
            // All the objects were saved.
            response.success("ok - updated: " + results.length);  //saveAll is now finished and we can properly exit with confidence :-)
          },
          error: function(error) {
            // An error occurred while saving one of the objects.
            response.error("failure on saving list ");
          },
        });
      }
    })
});

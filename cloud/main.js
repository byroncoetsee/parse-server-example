// parse-dashboard --appId tracking-turtle --masterKey TRACKINGTURTLE9874365982365982 --serverURL "http://tracking-turtle.herokuapp.com/parse" --appName tracking-turtle


var request;
var response;


Parse.Cloud.define("registerLocation", function(req, resp) {
  request = req
  response = resp

  var fullLocation = String(request.params.data).split(',');

  var lat = parseFloat(fullLocation[0]);
  var lng = parseFloat(fullLocation[1]);
  var charge = parseFloat(fullLocation[2]);

  var point = new Parse.GeoPoint({latitude: lat, longitude: lng});

  var LocationObject = Parse.Object.extend("Locations")
  var locationObject = new LocationObject();

  locationObject.set("location", point);
  locationObject.set("charge", charge);

  locationObject.save(null, {
    success: function(locationObject) {
      finished('New object created with objectId: ' + locationObject.id);
    },
    error: function(locationObject, error) {
      finished('Failed to create new object, with error code: ' + error.message);
    }
  });
})

function finished(IDs) {
  response.success(IDs);
}

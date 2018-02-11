// parse-dashboard --appId BLACKBOX-TURTLE --masterKey BLACKBOXTURTLE74562938472374561 --serverURL "http://blackbox-turtle.herokuapp.com/parse" --appName blackbox-turtle


var request;
var response;
var currentUser;

var orderObject = Parse.Object.extend("Orders");

// =========================================================================
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
// =========================================================================

Parse.Cloud.beforeSave("Orders", function(req, resp) {

  var cancelled = req.object.get("cancelled");
  var collected = req.object.get("collected");
  var expired = req.object.get("expired");

  if (cancelled || collected || expired) {
    req.object.set('open', false);
  } else {
    req.object.set('open', true);
  }

  resp.success();

});

Parse.Cloud.define("newOrder", function(req, resp) {
  request = req;
  response = resp;
  currentUser = request.user;

  var orderDetails = request.params.orderDetails;

  var query = new Parse.Query(orderObject);
  query.descending("number");

  query.first({
    success: function(object) {

      var nextOrderNumber = parseInt(object.get("number")) + 1;
      saveNewOrder(orderDetails, nextOrderNumber);
    },
    error: function(error) {
      finished(error.message);
    }
  });
})

function saveNewOrder(orderDetails, orderNumber) {
  var order = new orderObject();

  order.set('user', currentUser);
  order.set('details', orderDetails);
  order.set('number', orderNumber);
  order.set('cancelled', false);
  order.set('collected', false);
  order.set('expired', false);
  // order.set('open', true);

  order.save(null, {
    success: function(newOrder) {
      finished(newOrder);
    },
    error: function(newOrder, error) {
      finished('Failed to create new object, with error code: ' + error.message);
    }
  });
}

function finished(something) {
  response.success(something);
}

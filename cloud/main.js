// parse-dashboard --appId BLACKBOX-TURTLE --masterKey BLACKBOXTURTLE74562938472374561 --serverURL "http://blackbox-turtle.herokuapp.com/parse" --appName blackbox-turtle


var request;
var response;
var currentUser;

var orderObject = Parse.Object.extend("Orders");


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
  order.set('open', true);

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

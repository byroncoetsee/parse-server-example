
Parse.Cloud.define('hello', function(req, res) {
  res.success('Hi');
});

Parse.Cloud.define("pushFromCloud", function(request, response) {
  Parse.Cloud.httpRequest({
      method: 'POST',
      url: 'http://www.example.com/create_post',
      headers: {
        'Content-Type': 'application/json;charset=utf-8'
      },
      body: {
        title: 'Vote for Pedro',
        body: 'If you vote for Pedro, your wildest dreams will come true'
      }
    }).then(function(httpResponse) {
      console.log(httpResponse.text);
    }, function(httpResponse) {
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

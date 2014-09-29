var UI = require('ui');
var ajax = require('ajax');
var Vector2 = require('vector2');
var currentLat = 0;
var currentLng = 0;

var parseFeed = function(data, quantity) {
  var items = [];

  for(var i = 0; i < quantity; i++) {
    // Always upper case the description string
    //var title = data.list[i].weather[0].main;
    var title;
    if (data.geometries[i].properties.name){
     title = data.geometries[i].properties.name;
    } else {
      title = data.geometries[i].properties.amenity;
    }
    title = title.charAt(0).toUpperCase() + title.substring(1);

    // Get date/time substring
    var distance =  (data.geometries[i].properties.distance/1000).toFixed(1)+"km";

    // Add to menu items array
    items.push({
      title:title,
      subtitle:distance
    });
  }

  // Finally return whole array
  return items;
};

//parse node's types
var parseTypes = function(data) {
  var items = [];
  for(var i = 0; i < data.length; i++) {
    items.push({
      title: data[i].charAt(0).toUpperCase() + data[i].substring(1)
    });
  }
  return items;
};

// Show splash screen while waiting for data
var splashWindow = new UI.Window({
  backgroundColor:'black'
});

// Text element to inform user
var text = new UI.Text({
  position: new Vector2(0, 30),
  size: new Vector2(144, 40),
  text:'Downloading Data',
  font:'GOTHIC_28_BOLD',
  color:'white',
  textOverflow:'wrap',
  textAlign:'center'
});

// Add to splashWindow and show
splashWindow.add(text);
splashWindow.show();

// Grab the current position.
window.navigator.geolocation.getCurrentPosition(

  // Location Success
  function (position) {

    // Extract the coordinates.
    var coordinates = position.coords;
    currentLat = coordinates.latitude;
    currentLng = coordinates.longitude;

    // Make request to wami MAP to get the node's types
    ajax(
      {
        url:'http://map.wami.it/nodes',
        type:'json'
      },
      function(data) {
        // Create an array of Menu items
        var menuItems = parseTypes(data);
    
        // Construct Menu to show to user
        var resultsMenu = new UI.Menu({
          sections: [{
            title: 'Types found',
            items: menuItems
          }]
        });
    
        // Add an action for SELECT
        resultsMenu.on('select', function(e) {
          splashWindow.show();
          
          //Set London as current location
          //currentLat = 51.493916;
          //currentLng = -0.137587;
                              
          ajax({
            url:'http://map.wami.it/nearest/'+currentLat.toFixed(6)+"/"+currentLng.toFixed(6)+"/type/"+data[e.itemIndex].replace(" ","_"),
            type:'json'
          }, function(dataNodes) {
            splashWindow.hide();
            // Create an array of Menu items
            var menu = parseFeed(dataNodes, 10);
            var resultsMenuTypes = new UI.Menu({
              sections: [{
                title: dataNodes.geometries[e.itemIndex],
                items: menu
              }]
          });
                  
          // Add an action for SELECT
          resultsMenuTypes.on('select', function(e) {
            
            // Assemble body string
            var content = "";
            var titleCard;
            if (dataNodes.geometries[e.itemIndex].properties.name){
              titleCard = dataNodes.geometries[e.itemIndex].properties.name;
            } else {
              titleCard = dataNodes.geometries[e.itemIndex].properties.amenity;
            }

            for(i=0; i<=Object.keys(dataNodes.geometries[e.itemIndex].properties).length-1; i++){
              content += Object.keys(dataNodes.geometries[e.itemIndex].properties)[i]+": "+dataNodes.geometries[e.itemIndex].properties[Object.keys(dataNodes.geometries[e.itemIndex].properties)[i]]+"\n";
            }

            // Create the Card for detailed view
            var detailCard = new UI.Card({
              title: titleCard,
              subtitle: "distance: "+(dataNodes.geometries[e.itemIndex].properties.distance/1000).toFixed(1)+"km",
              body: content
            });
              detailCard.show();
         });  

        resultsMenuTypes.show();

      }, function(error) {
        console.log('Download failed: ' + error);
      });
          
  
    });
    
    // Show the Menu, hide the splash
    resultsMenu.show();
    splashWindow.hide();
  },function(error) {
    console.log('Download failed: ' + error);
  });
}, function (error) {
    console.warn('locationWatcher (' + error.code + '): ' + error.message);
    pebble_set_message('Location unavailable!');
},{ "timeout": 15000, "maximumAge": 60000 });
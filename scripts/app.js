// Leaflet map
var map = L.map('map').setView([ 42.334929, -71.017996 ], 16);
map.attributionControl.setPrefix('');

// basemap
var terrain = 'http://{s}.tiles.mapbox.com/v3/mapmeld.map-ofpv1ci4/{z}/{x}/{y}.png';
var terrainAttrib = 'Map data &copy; 2013 OpenStreetMap contributors, Tiles &copy; 2013 MapBox';
L.tileLayer(terrain, {maxZoom: 18, attribution: terrainAttrib}).addTo(map);

// set up PouchDB / retrieve any data
var db = new PouchDB("recordings");
db.allDocs({include_docs: true}, function(err, response){
  if(err){
    return console.log(err);
  }
  for(var r=0;r<response.rows.length;r++){
    L.marker(response.rows[r].doc.latlng).bindPopup(response.rows[r].doc.content).addTo(map);
  }
});

// click to place marker
var activeMarker = null;
var interviewMarkers = [ ];
map.on('click', function(e){
  activeMarker = L.marker(e.latlng).addTo(map);
  activeMarker.bindPopup("Transcribe me<br/><textarea id='notes' rows='8' cols='30'></textarea>");
  activeMarker.openPopup();
  $("#notes").ime();
  
  db.post({
    latlng: [e.latlng.lat, e.latlng.lng],
    content: "Recorded"
  }, function(err, response){
    console.log(err || response);
  });
});
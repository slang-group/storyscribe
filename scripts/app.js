// Intro popup
var welcome = "<h2>StoryScribe</h2>"
welcome += "<p>Project to record stories in the field</p>";
welcome += "<ul>";
welcome += "<li>Store locally, upload later</li>";
welcome += "<li>Transcribe into any language</li>";
welcome += "<li><a href='https://github.com/mapmeld/storyscribe'>Open Source</a> on GitHub</li>";
welcome += "</ul>";
welcome += "<a href='#' class='btn' onclick='TINY.box.hide()'>Start &gt;</a>";
TINY.box.show({ html:welcome,animate:true,close:true,mask:true,boxid:'welcome'});

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
var popupTxt = "Transcribe me<br/>";
popupTxt += "<textarea id='notes' rows='8' cols='30'></textarea><br/><br/>"
popupTxt += "<a class='btn savebtn' href='#' onclick='saveText()'>Save</a>";
map.on('click', function(e){
  activeMarker = L.marker(e.latlng)
    .bindPopup(popupTxt)
    .addTo(map)
    .openPopup();
  $("#notes").ime();
});

function saveText(){
  var textContent = $("#notes").val();
  db.post({
    latlng: [activeMarker.getLatLng().lat, activeMarker.getLatLng().lng],
    content: textContent
  }, function(err, response){
    console.log(err || response);
  });
  
  var doneMarker = L.marker([activeMarker.getLatLng().lat, activeMarker.getLatLng().lng])
    .bindPopup(textContent)
    .addTo(map);

  map.closePopup();
  map.removeLayer(activeMarker);
  activeMarker = null;
  
  interviewMarkers.push(doneMarker);
}
// TileMill settings for offline maps
var TileMillProjectName = "MarshallIslands";
var tilemillLayer = null;
function checkTileMill(){
  if($("#tilemilled")[0].checked){
    if(TileMillProjectName == "MarshallIslands"){
      alert("Change the 2nd line of scripts/app.js to the name of your local TileMill project");
    }
    if(!tilemillLayer){
      tilemillLayer = L.tileLayer('http://localhost:20008/tile/' + TileMillProjectName + '/{z}/{x}/{y}.png', {maxZoom: 18, attribution: ""}).addTo(map);
    }
    map.removeLayer(terrainLayer);
    tilemillLayer.addTo(map);
  }
  else if(!$("#tilemilled")[0].checked){
    map.removeLayer(tilemillLayer);
    terrainLayer.addTo(map);
  }
}

// Intro popup
var welcome = "<h2>StoryScribe</h2>"
welcome += "<p>Project to record stories in the field</p>";
welcome += "<ul>";
welcome += "<li>Click the map to add a point</li>";
welcome += "<li>Record audio in browser to upload later</li>";
welcome += "<li>Transcribe into any language</li>";
welcome += "<li><label><input id='tilemilled' type='checkbox' onchange='checkTileMill()'>TileMill offline (when checked)</label></li>";
welcome += "<li><a href='https://github.com/mapmeld/storyscribe'>Open Source</a> on GitHub</li>";
welcome += "</ul>";
welcome += "<a href='#' class='btn' onclick='TINY.box.hide()'>Start &gt;</a>";
TINY.box.show({ html:welcome,animate:true,close:true,mask:true,boxid:'welcome'});

// getUserMedia compatibility
window.URL = window.URL || window.webkitURL;
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

// Leaflet map
var map = L.map('map').setView([ 42.334929, -71.017996 ], 16);
map.attributionControl.setPrefix('');

// basemap
var terrain = 'http://{s}.tiles.mapbox.com/v3/mapmeld.map-ofpv1ci4/{z}/{x}/{y}.png';
var terrainAttrib = 'Map data &copy; 2013 OpenStreetMap contributors, Tiles &copy; 2013 MapBox';
var terrainLayer = L.tileLayer(terrain, {maxZoom: 18, attribution: terrainAttrib}).addTo(map);

// set up PouchDB / retrieve any data
var db = new PouchDB("recordings");
db.allDocs({include_docs: true}, function(err, response){
  if(err){
    return console.log(err);
  }
  for(var r=0;r<response.rows.length;r++){
    var popupContent = response.rows[r].doc.content;
    if(response.rows[r].doc._attachments && response.rows[r].doc._attachments.audio){
      popupContent = "<audio controls='controls' src=''></audio><br/>" + transcribeTxt(popupContent);
      var audiomark = L.marker(response.rows[r].doc.latlng, { draggable: true }).bindPopup(popupContent).addTo(map);
      bindMarker(audiomark, response.rows[r].doc._id);
    }
    else if(popupContent && popupContent.length){
      L.marker(response.rows[r].doc.latlng, { draggable: true }).bindPopup(popupContent).addTo(map);
    }
  }
});

function bindMarker(marker, docid){
  marker.on('click', function(e){
    activeMarker = marker;
    activeMarkerId = docid;
    db.getAttachment(docid, 'audio', function(err, blob){
      $("audio")[0].src = window.URL.createObjectURL(blob);
    });
    setTimeout(function(){
      $("#notes").ime();
      var audioTimeout = null;
      $("#notes").on('keyup', function(e){
        $("audio")[0].pause();
        if(audioTimeout){
          clearTimeout(audioTimeout);
        }
        audioTimeout = setTimeout(function(){
          $("audio")[0].play();
        }, 1200);
      });
      $("#notes").on('keydown', function(e){
        $("audio")[0].pause();
        if(audioTimeout){
          clearTimeout(audioTimeout);
        }
        audioTimeout = null;
      });
      
    }, 300);
  })
  .on('dragend', function(e){
    db.get(docid, function(err, doc){
      doc.latlng = [ marker.getLatLng().lat, marker.getLatLng().lng ];
      db.put(doc);
    });
  });
}

// click to place marker
var activeMarker = null;
var activeMarkerId = null;
var interviewMarkers = [ ];
var mainstream = null;
var recorder = null;

var popupTxt = "Record me<br/>";
popupTxt += "<audio controls='controls'></audio><br/>";
popupTxt += "<a class='btn savebtn recordbtn' href='#' onclick='toggleRecord()'>Record</a>";
map.on('click', function(e){
  activeMarker = L.marker(e.latlng, { draggable: true })
    .bindPopup(popupTxt)
    .addTo(map)
    .openPopup();
  $("#notes").ime();
});

var recording = false;
function toggleRecord(){
  recording = !recording;
  if(!recording){
    $(".recordbtn").text("Record");
    recorder.stop();
    mainstream.stop();
    recorder.exportWAV(function(wavaudio) {
      $("audio")[0].src = window.URL.createObjectURL(wavaudio);
      var saveMarker = {
        latlng: [activeMarker.getLatLng().lat, activeMarker.getLatLng().lng],
        content: ""
      };
      db.post(saveMarker, function(err, response){
        if(err){
          return console.log(err);
        }
        //console.log(response.id);
        db.putAttachment(response.id, 'audio', response.rev, wavaudio, 'audio/wav', function(err, response){
          console.log( err || response );
          
          var popupContent = "<audio controls='controls' src=''></audio><br/>" + transcribeTxt('');
          var audiomark = L.marker(saveMarker.latlng, { draggable: true }).bindPopup(popupContent).addTo(map);
          bindMarker(audiomark, response.id);
          
          map.removeLayer(activeMarker);
          activeMarker = null;
        });
      });
      
    });
  }
  else{
    $(".recordbtn").text("Stop");
    
    var audio = $('audio')[0];
    if(navigator.getUserMedia){
      navigator.getUserMedia({audio: true, video: false}, function(stream){
        mainstream = stream;
        //audio.src = window.URL.createObjectURL(stream);
        var context = new webkitAudioContext();
        var mediaStreamSource = context.createMediaStreamSource(stream);
        recorder = new Recorder(mediaStreamSource);
        recorder.record();
      }, function(err){
        console.log(err);
      });
    }
    else{
      console.log('no user media');
    }
  }
}

function transcribeTxt(content){
  var mytxt = "Transcribe me<br/>";
  mytxt += "<textarea id='notes' rows='8' cols='30'>" + content + "</textarea><br/><br/>"
  mytxt += "<a class='btn savebtn' href='#' onclick='saveText()'>Save</a>";
  return mytxt;
}

function saveText(){
  var textContent = $("#notes").val();
  db.get(activeMarkerId, function(err, doc){
    doc.content = textContent;
    db.put(doc);
    
    var popupContent = "<audio controls='controls' src=''></audio><br/>" + transcribeTxt(textContent);
    var audiomark = L.marker(activeMarker.getLatLng(), { draggable: true }).bindPopup(popupContent).addTo(map);
    bindMarker(audiomark, doc["_id"]);
    
    map.removeLayer(activeMarker);
    activeMarker = null;
  });
}
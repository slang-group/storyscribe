## StoryScribe

A tool to map, record, and transcribe field interviews

Click a point on the map to add an intervew point. Start recording using the
browser, and stop recording to save the data locally.

When you transcribe the interview, as soon as you start typing, the audio
playback will pause until you resume typing. This allows you to transcribe
bite-sized chunks at a time.

## Components

### Map

* Open source Leaflet map
* Can be set to use tiles from local TileMill server

### Recorder

* getUserMedia API - audio (and video?) recording

### Pouch DB

* Offline or on a data plan? Upload interviews when you want to
* Local Storage? Indexed DB? I'm not sure how Pouch DB works.

### Transcription

* Transcription mode pauses playback while typing
* Using WikiMedia's <a href="https://github.com/wikimedia/jquery.ime">jQuery.IME</a> for input in many languages

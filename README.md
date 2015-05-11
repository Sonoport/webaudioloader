WebAudioLoader
==============

Caching Loader and Decoder for audio files to be used with Web Audio.

## Usage:

```js
var WebAudioLoader = require("webaudioloader");

var audioContext = new AudioContext();

var options = {
	context : audioContext,
	cache : true,
	maxCacheSize : 2000,
	onprogress : function (event){
		console.log('Loading some files...', event.loaded/event.total);
	}
}

var wal = new WebAudioLoader(options);

wal.load('http://www.example.com/audio.mp3', {
		onload : function (err, buffer){
		if(!err){
			console.log('Loaded file of duration', buffer.duration);
		}
	},
});


```

## Why WebAudioLoader

- Easy API (deals with loading and decoding audio for you) for XHR loading of audio.
- Uses [LRU Cache](https://www.npmjs.com/package/lru-cache) for caching decoded audio.
- Uses node style callbacks (err, buffer) to return decoded buffers.
- Registers a global single instance and returns a reference if one is found.

## Note

- [Web Audio](http://webaudio.github.io/web-audio-api/) only works in a browser (for now), so does this module.

## Install
1. With npm do:

	`npm install webaudioloader`

2. Use browserify:

	`var WebAudioLoader = require('webaudioloader')`

	and

	`browserify myapp.js > bundle.js`

3. Standalone (AMD, global object) [builds are avilable here](https://github.com/notthetup/webaudioloader/tree/master/dist).



## API

### Constructor

eg : `var wal = new WebAudioLoader(options);`

- option object can have following optional properties

	- `cache` : boolean - enable/disable cache globally. Default is _true_.
	- `maxCacheSize` : Number - maximum size in kB of cached audio buffers. Default is _1000_.
	- `onload` : Function - global callback when a load operation is complete. The callback has node style return arguments `callback(err, buffer)`.
	- `onprogress` : Function - global callback when a load operation is in progress. The callback return a progress Event.
	- `context` : AudioContext - an [AudioContext](http://webaudio.github.io/web-audio-api/#the-audiocontext-interface) to use for decoding the audio.


### Properties

- `onload` : Function - global callback when a load operation is complete. The callback has node style return arguments `callback(err, buffer)`.

	eg : `wal.onload = function(){};`

- `onprogress` : Function - global callback when a load operation is in progress. The callback return a progress Event.

	eg : `wal.onprogress = function(){};`

- `cache` : boolean - enable/disable cache globally.

	 eg : `wal.cache = false;`


### Methods

- `load` : Main API method to load ()and decode) a given AudioFile.

	eg :
	```js
	wal.load('http://www.example.com/audio.mp3');
	wal.load([object File]);
	wal.load('http://www.example.com/audio.mp3', options);
	```
	- the source argument can either be a URL String or a File object
	- option object can have following optional properties

		- `decode` : boolean - toggle if the audio file should be decoded. If decoded the `onload` callback returns an `AudioBuffer`, else it returns an `ArrayBuffer`.
		- `cache` : boolean - if the audio from this specific load call should be  cached. Overrides the global property.
		- `onload` : Function - callback when this specific load operation is complete. The callback has node style return arguments `callback(err, buffer)`.
		- `onprogress` : Function - callback when this specific load operation is in progress. The callback return a progress Event.

- `flushCache` : Resets the internal cache of the loader.

	eg : `wal.flushCache();`



## License

MIT

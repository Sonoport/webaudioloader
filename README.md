webaudioloader
==============

Caching Loader and Decoder for audio files to be used with Web Audio.

# Work in Progress


## Proposed API

```js
// var wal = new WebAudioLoader({cache : false, maxCacheSize : 1000, onload: function(){}, onprogress: function(){}, context : audioContext })
// wal.onload = function(){};
// wal.cache = false;
// wal.onprogress = function(){};
// wal.load('http://www.example.com/audio.mp3');
// wal.load([object File]);
// wal.load('http://www.example.com/audio.mp3', {decode: false, startPoint : 1, endPoint : 3, cache : false , onload: function(){}, onprogress: function(){}});
```

## License

MIT

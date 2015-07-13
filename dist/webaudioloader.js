/*webaudioloader - v1.0.3 - Mon Jul 13 2015 10:07:27 GMT+0800 (SGT) */ 
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.webaudioloader = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

/*
	constructor
	var wal = new WebAudioLoader({cache : false, maxCacheSize : 1000, onload: function(){}, onprogress: function(){}, context : audioContext })
 */
function WebAudioLoader (options){

	if ( !( this instanceof WebAudioLoader ) ) {
		throw new TypeError( "WebAudioLoader constructor cannot be called as a function." );
	}

	window.AudioContext = window.AudioContext || window.webkitAudioContext;

	// Singleton using a global reference.
	if (window.webAudioLoader){
		return window.webAudioLoader;
	}

		// setup cache object
	this._cachedAudio = null;

	// Define default local properties
	this.cache = true;
	this.onload = null;
	this.onprogress = null;
	Object.defineProperty(this,'maxCacheSize', {
		enumerable: true,
		configurable: false,
		set : function (maxSize){
			if (this._cachedAudio){
				this._cachedAudio.max = maxSize;
			}
		},
		get : function (){
			return this._cachedAudio.max;
		}
	});

	// Options parsing.
	options = options || {};
	for (var opt in options){
		if (this.hasOwnProperty(opt) && options[opt] !== undefined){
			this[opt] = options[opt];
		}
	}
	this.context = options.audioContext || new AudioContext();

	// Setup Cache
	var cacheOptions = {
		max: options.maxCacheSize || 1000,
		length: function(audioBuffer){
			return (audioBuffer.length*audioBuffer.numberOfChannels*4)/1000;
		}
	};
	this._cachedAudio = require('lru-cache')(cacheOptions);


	// Resgiter as global
	window.webAudioLoader = this;

	// Helper functions
	this._loadURLOrFile = function (URL, onprogress, onload){
		var urlType = Object.prototype.toString.call( URL );
		var request = null;
		if (urlType === '[object String]'){
			request = new XMLHttpRequest();
			request.open('GET', URL, true);
			request.responseType = 'arraybuffer';
		}
		else if (urlType === '[object File]' || urlType === '[object Blob]' ){
			request = new FileReader();
		}else{
			return;
		}

		request.onload = function () {
			if (urlType === '[object String]' && request.status === 200){
				if (typeof onload === 'function'){
					onload(null, request.response);
				}
			}else if (urlType === '[object File]' || urlType === '[object Blob]'){
				if (typeof onload === 'function'){
						onload(null, request.result);
				}
			}else{
				if (typeof onload === 'function'){
					onload(new Error("Loading Error"), null);
				}
			}
		};
		request.onerror = function(){
			if (typeof onload === 'function'){
				onload(new Error("Loading Error"), null);
			}
		};
		request.onprogress = function(event){
			if (typeof onprogress === 'function'){
				onprogress(event);
			}

			if (typeof this.onprogress === 'function'){
				this.onprogress(event);
			}
		}.bind(this);

		if (urlType === '[object String]'){
			request.send();
		}else if (urlType === '[object File]' || urlType === '[object Blob]' ){
			request.readAsArrayBuffer( URL );
		}

	};
}
/*
	load method.
	wal.load('http://www.example.com/audio.mp3');
	wal.load([object File]);
	wal.load('http://www.example.com/audio.mp3', {decode: false,cache : false , onload: function(){}, onprogress: function(){}});
 */
WebAudioLoader.prototype.load = function (source, options){

	var decode =  true;
	var thisLoadCache = true;

	if (!options) {
		options = {};
	}
	var thisLoadOnload = options.onload || null;
	var thisLoadOnprogress = options.onprogress || null;
	// var startPoint = options.startPoint || 0;
	// var endPoint = options.endPoint || 0;


	if (options.cache !== null && options.cache !== undefined){
		thisLoadCache = options.cache;
	}else{
		thisLoadCache = this.cache;
	}

	if (options.decode !== null && options.decode !== undefined){
		decode = options.decode;
	}

	var onLoadProxy = function (err,audioBuffer){
		if(typeof thisLoadOnload === 'function'){
			thisLoadOnload(err,audioBuffer);
		}
		if (typeof this.onload === 'function'){
			this.onload(err,audioBuffer);
		}
	}.bind(this);

	if (this.cache && thisLoadCache){
		var testCache = this._cachedAudio.get(source);
		if (testCache){
			onLoadProxy(null, testCache);
			return;
		}
	}

	this._loadURLOrFile(source, thisLoadOnprogress, function (err, arrayBuffer){
		if(err || !decode){
			onLoadProxy(err,arrayBuffer);
		}else{
			this.context.decodeAudioData(arrayBuffer, function(audioBuffer){
				if (thisLoadCache){
					this._cachedAudio.set(source,audioBuffer);
				}
				onLoadProxy(err,audioBuffer);
			}.bind(this), function(){
				onLoadProxy(new Error("Decoding Error"),null);
			}.bind(this));
		}
	}.bind(this));
};

/*
	flushCache method
	Resets and empties the cache.
 */
WebAudioLoader.prototype.flushCache = function (){
	this._cachedAudio.reset();
};

module.exports = WebAudioLoader;

},{"lru-cache":2}],2:[function(require,module,exports){
;(function () { // closure for web browsers

if (typeof module === 'object' && module.exports) {
  module.exports = LRUCache
} else {
  // just set the global for non-node platforms.
  this.LRUCache = LRUCache
}

function hOP (obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

function naiveLength () { return 1 }

function LRUCache (options) {
  if (!(this instanceof LRUCache))
    return new LRUCache(options)

  if (typeof options === 'number')
    options = { max: options }

  if (!options)
    options = {}

  this._max = options.max
  // Kind of weird to have a default max of Infinity, but oh well.
  if (!this._max || !(typeof this._max === "number") || this._max <= 0 )
    this._max = Infinity

  this._lengthCalculator = options.length || naiveLength
  if (typeof this._lengthCalculator !== "function")
    this._lengthCalculator = naiveLength

  this._allowStale = options.stale || false
  this._maxAge = options.maxAge || null
  this._dispose = options.dispose
  this.reset()
}

// resize the cache when the max changes.
Object.defineProperty(LRUCache.prototype, "max",
  { set : function (mL) {
      if (!mL || !(typeof mL === "number") || mL <= 0 ) mL = Infinity
      this._max = mL
      if (this._length > this._max) trim(this)
    }
  , get : function () { return this._max }
  , enumerable : true
  })

// resize the cache when the lengthCalculator changes.
Object.defineProperty(LRUCache.prototype, "lengthCalculator",
  { set : function (lC) {
      if (typeof lC !== "function") {
        this._lengthCalculator = naiveLength
        this._length = this._itemCount
        for (var key in this._cache) {
          this._cache[key].length = 1
        }
      } else {
        this._lengthCalculator = lC
        this._length = 0
        for (var key in this._cache) {
          this._cache[key].length = this._lengthCalculator(this._cache[key].value)
          this._length += this._cache[key].length
        }
      }

      if (this._length > this._max) trim(this)
    }
  , get : function () { return this._lengthCalculator }
  , enumerable : true
  })

Object.defineProperty(LRUCache.prototype, "length",
  { get : function () { return this._length }
  , enumerable : true
  })


Object.defineProperty(LRUCache.prototype, "itemCount",
  { get : function () { return this._itemCount }
  , enumerable : true
  })

LRUCache.prototype.forEach = function (fn, thisp) {
  thisp = thisp || this
  var i = 0
  var itemCount = this._itemCount

  for (var k = this._mru - 1; k >= 0 && i < itemCount; k--) if (this._lruList[k]) {
    i++
    var hit = this._lruList[k]
    if (isStale(this, hit)) {
      del(this, hit)
      if (!this._allowStale) hit = undefined
    }
    if (hit) {
      fn.call(thisp, hit.value, hit.key, this)
    }
  }
}

LRUCache.prototype.keys = function () {
  var keys = new Array(this._itemCount)
  var i = 0
  for (var k = this._mru - 1; k >= 0 && i < this._itemCount; k--) if (this._lruList[k]) {
    var hit = this._lruList[k]
    keys[i++] = hit.key
  }
  return keys
}

LRUCache.prototype.values = function () {
  var values = new Array(this._itemCount)
  var i = 0
  for (var k = this._mru - 1; k >= 0 && i < this._itemCount; k--) if (this._lruList[k]) {
    var hit = this._lruList[k]
    values[i++] = hit.value
  }
  return values
}

LRUCache.prototype.reset = function () {
  if (this._dispose && this._cache) {
    for (var k in this._cache) {
      this._dispose(k, this._cache[k].value)
    }
  }

  this._cache = Object.create(null) // hash of items by key
  this._lruList = Object.create(null) // list of items in order of use recency
  this._mru = 0 // most recently used
  this._lru = 0 // least recently used
  this._length = 0 // number of items in the list
  this._itemCount = 0
}

// Provided for debugging/dev purposes only. No promises whatsoever that
// this API stays stable.
LRUCache.prototype.dump = function () {
  return this._cache
}

LRUCache.prototype.dumpLru = function () {
  return this._lruList
}

LRUCache.prototype.set = function (key, value, maxAge) {
  maxAge = maxAge || this._maxAge
  var now = maxAge ? Date.now() : 0

  if (hOP(this._cache, key)) {
    // dispose of the old one before overwriting
    if (this._dispose)
      this._dispose(key, this._cache[key].value)

    this._cache[key].now = now
    this._cache[key].maxAge = maxAge
    this._cache[key].value = value
    this.get(key)
    return true
  }

  var len = this._lengthCalculator(value)
  var hit = new Entry(key, value, this._mru++, len, now, maxAge)

  // oversized objects fall out of cache automatically.
  if (hit.length > this._max) {
    if (this._dispose) this._dispose(key, value)
    return false
  }

  this._length += hit.length
  this._lruList[hit.lu] = this._cache[key] = hit
  this._itemCount ++

  if (this._length > this._max)
    trim(this)

  return true
}

LRUCache.prototype.has = function (key) {
  if (!hOP(this._cache, key)) return false
  var hit = this._cache[key]
  if (isStale(this, hit)) {
    return false
  }
  return true
}

LRUCache.prototype.get = function (key) {
  return get(this, key, true)
}

LRUCache.prototype.peek = function (key) {
  return get(this, key, false)
}

LRUCache.prototype.pop = function () {
  var hit = this._lruList[this._lru]
  del(this, hit)
  return hit || null
}

LRUCache.prototype.del = function (key) {
  del(this, this._cache[key])
}

function get (self, key, doUse) {
  var hit = self._cache[key]
  if (hit) {
    if (isStale(self, hit)) {
      del(self, hit)
      if (!self._allowStale) hit = undefined
    } else {
      if (doUse) use(self, hit)
    }
    if (hit) hit = hit.value
  }
  return hit
}

function isStale(self, hit) {
  if (!hit || (!hit.maxAge && !self._maxAge)) return false
  var stale = false;
  var diff = Date.now() - hit.now
  if (hit.maxAge) {
    stale = diff > hit.maxAge
  } else {
    stale = self._maxAge && (diff > self._maxAge)
  }
  return stale;
}

function use (self, hit) {
  shiftLU(self, hit)
  hit.lu = self._mru ++
  self._lruList[hit.lu] = hit
}

function trim (self) {
  while (self._lru < self._mru && self._length > self._max)
    del(self, self._lruList[self._lru])
}

function shiftLU (self, hit) {
  delete self._lruList[ hit.lu ]
  while (self._lru < self._mru && !self._lruList[self._lru]) self._lru ++
}

function del (self, hit) {
  if (hit) {
    if (self._dispose) self._dispose(hit.key, hit.value)
    self._length -= hit.length
    self._itemCount --
    delete self._cache[ hit.key ]
    shiftLU(self, hit)
  }
}

// classy, since V8 prefers predictable objects.
function Entry (key, value, lu, length, now, maxAge) {
  this.key = key
  this.value = value
  this.lu = lu
  this.length = length
  this.now = now
  if (maxAge) this.maxAge = maxAge
}

})()

},{}]},{},[1])(1)
});
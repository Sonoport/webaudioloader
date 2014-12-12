"use strict";

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
			if (request.status === 200){
				if (typeof onload === 'function'){
					onload(null, request.response);
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

WebAudioLoader.prototype.load = function (source, options){

	var decode =  true;
	var thisLoadCache = true;
	var thisLoadOnload = options.onload || null;
	var thisLoadOnprogress = options.onprogress || null;
	// var startPoint = options.startPoint || 0;
	// var endPoint = options.endPoint || 0;


	if (options.cache !== null && options.cache !== undefined){
		thisLoadCache = options.cache;
	}

	if (options.decode !== null && options.decode !== undefined){
		decode = options.decode;
	}

	var onLoadProxy = function (err,arraybuffer){
		if(typeof thisLoadOnload === 'function'){
			thisLoadOnload(err,arraybuffer);
		}
		if (typeof this.onload === 'function'){
			this.onload(err,arraybuffer);
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
				if (thisLoadCache && this.cache){
					this._cachedAudio.set(source,audioBuffer);
				}
				onLoadProxy(err,audioBuffer);
			}.bind(this), function(){
				onLoadProxy(new Error("Decoding Error"),null);
			}.bind(this));
		}
	}.bind(this));
};

WebAudioLoader.prototype.flushCache = function (){
	this._cache.reset();
};

module.exports = WebAudioLoader;

"use strict";

function WebAudioLoader (options){

	if ( !( this instanceof WebAudioLoader ) ) {
		throw new TypeError( "WebAudioLoader constructor cannot be called as a function." );
	}

	window.AudioContext = window.AudioContext || window.webkitAudioContext;

	if (window.webAudioLoader){
		return window.webAudioLoader;
	}

	this.cache = true;
	this.maxCacheSize = 1000;
	this.onload = null;
	this.onprogress = null;

	options = options || {};

	this.context = options.audioContext || new AudioContext();

	for (var opt in options){
		if (this.hasOwnProperty(opt) && options[opt] !== undefined){
			this[opt] = options[opt];
		}
	}

	this._cachedAudio = [];
	this._cachedSize = 0;

	window.webAudioLoader = this;

	this._cacheFlush = function(sizeToClear, sortAlgorithm){
		if (typeof sortAlgorithm !== 'function'){
			sortAlgorithm = function (a,b){
				return a.timestamp - b.timestamp;
			};
		}
		this._cachedAudio.sort(sortAlgorithm);

		var freedBuffer = 0;
		while (freedBuffer < sizeToClear){
			var removedBuffer = this._cachedAudio.pop();
			freedBuffer = freedBuffer + this._sizeOfBufferInKB(removedBuffer);
		}
	};

	this._addToCache = function(source, audioBuffer){
		var sizeOfBuffer = this._sizeOfBufferInKB(audioBuffer);
		if (this._cachedSize + sizeOfBuffer >= this.maxCacheSize){
			this._cacheFlushOldest(sizeOfBuffer);
		}else{
			this._cachedSize = this._cachedSize + sizeOfBuffer;
			this._cachedAudio.push({
				source : source,
				buffer : audioBuffer,
				timestamp : this.audioContext.currentTime
			});
		}
	};

	this._sizeOfBufferInKB = function(audioBuffer){
		return (audioBuffer.length*audioBuffer.numberOfChannels*4)/1000;
	};

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
			if (typeof onload === 'function'){
				onload(null, request.response);
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
		};

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
	var thisLoadOnprogress = options.onload || null;
	// var startPoint = options.startPoint || 0;
	// var endPoint = options.endPoint || 0;


	if (options.cache !== null || options.cache !== undefined){
		thisLoadCache = options.cache;
	}

	if (options.decode !== null || options.decode !== undefined){
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
		var cacheSearch = this.cachedAudio.filter(function(thisCacheItem){
			if (thisCacheItem.source === source){
				return true;
			}
		});

		if (cacheSearch.length > 0){
			console.log("Cache Hit");
			onLoadProxy(null, cacheSearch[0].buffer);
		}
	}

	this._loadURLOrFile(source, thisLoadOnprogress, function (err, arrayBuffer){
		if(err || !decode){
			onLoadProxy(err,arrayBuffer);
		}else{
			this.audioContext.decodeAudioData(arrayBuffer, function(audioBuffer){
				if (thisLoadCache && this.cache){
					this._addToCache(source,audioBuffer);
				}
				onLoadProxy(err,arrayBuffer);
			}.bind(this), function(){
				onLoadProxy(new Error("Decoding Error"),null);
			}.bind(this));
		}
	}.bind(this));
};

WebAudioLoader.prototype.flushCache = function (){
	this._cachedAudio = [];
	this._cachedSize = 0;
};

module.exports = WebAudioLoader;

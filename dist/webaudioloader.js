/*webaudioloader - v1.0.0 - Tue Dec 09 2014 17:36:55 GMT+0800 (SGT) */ 
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var o;"undefined"!=typeof window?o=window:"undefined"!=typeof global?o=global:"undefined"!=typeof self&&(o=self),o.webaudioloader=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

function WebAudioLoader (options){

	window.AudioContext = window.AudioContext || window.webkitAudioContext;

	if (window.webAudioLoader){
		return window.webAudioLoader;
	}

	this.cache = true;
	this.maxCacheSize = 1000;
	this.onload = null;
	this.onprogress = null;

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


// var wal = new WebAudioLoader({cache : false, maxCacheSize : 1000, onload: function(){}, onprogress: function(){}, context : audioContext })
// wal.onload = function(){};
// wal.cache = false;
// wal.onprogress = function(){};
// wal.load('http://www.example.com/audio.mp3');
// wal.load([object File]);
// wal.load('http://www.example.com/audio.mp3', {decode: false, startPoint : 1, endPoint : 3, cache : false , onload: function(){}, onprogress: function(){}});

},{}]},{},[1])(1)
});
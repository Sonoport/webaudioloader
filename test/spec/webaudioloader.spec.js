"use strict";

var test = require('tape');
var WebAudioLoader = require('../../');

var beforeEach = function (){
	// reset global;
	window.webAudioLoader = null;
};


test('WebAudioLoader Constructor', function (t) {
	beforeEach();
	t.plan(4);
	var wal;
	var wal2;
	t.doesNotThrow(function(){
		wal = new WebAudioLoader();
	},{}, "Initializes without error");

	t.equals(wal, window.webAudioLoader, "Sets Global webAudioLoader property");

	t.doesNotThrow(function(){
		wal2 = new WebAudioLoader();
	},{}, "Initializes again without error");

	t.equals(wal, wal2, "Yield a reference to the same object if initialized twice");
});

test('WebAudioLoader Constructor Arguments', function (t) {
	beforeEach();
	t.plan(5);
	var testFn = function (){};
	var testSize = 20;
	var wal;

	t.doesNotThrow(function(){
		wal = new WebAudioLoader({
			cache : false,
			maxCacheSize : testSize,
			onload : testFn,
			onprogress : testFn
		});
	},{}, "Initializes without error");

	t.equals(wal.cache, false, "Sets onload cache on arguments");

	t.equals(wal.maxCacheSize, testSize, "Sets onload maxCacheSize on arguments");

	t.equals(wal.onload, testFn, "Sets onload based on arguments");

	t.equals(wal.onprogress, testFn, "Sets onprogress based on arguments");
});

test('WebAudioLoader Properties', function (t) {
	beforeEach();
	t.plan(7);
	var wal;

	wal = new WebAudioLoader();

	t.ok(wal.context instanceof AudioContext, "Has a valid audio context");

	t.ok(wal.cache, "Defaults cache to true");

	t.equals(wal.maxCacheSize, 1000, "Defaults maxCacheSize to 1000");

	t.equals(wal.onload, null, "Defaults onload to null");

	t.equals(wal.onprogress, null, "Defaults onprogress to null");

	t.equals(typeof wal.load, 'function', "Has a function called load");

	t.equals(typeof wal.flushCache, 'function', "Has a function called flushCache");
});

test('WebAudioLoader Loading', function (t){
	beforeEach();
	t.plan(9);


	var validURL = "https://dl.dropboxusercontent.com/u/77191118/sounds/Sin440Hz1s-Original.wav";
	var invalidURL = "https://dl.dropboxusercontent.com/u/77191118/sounds/Sin400Hz.mp3";

	var globalOnLoad = 0;
	var globalOnProgress = 0;

	var wal = new WebAudioLoader();

	wal.onload = function (){
		if (globalOnLoad === 0){
			t.pass("Throws global onload events");
		}
		globalOnLoad++;
	};

	wal.onprogress = function (){
		if (event.loaded / event.total >= 1){
			if (globalOnProgress === 0){
				t.pass("Throws global onprogress events");
			}
			globalOnProgress++;
		}
	};

	wal.load(validURL, {onload: function(err, buffer){
		t.equals(err,null, "Loading a valid URL shouldn't error");
		t.ok(buffer instanceof AudioBuffer, "Loading a valid URL should return a AudioBuffer");
	}});

	wal.load(validURL, {decode: false, onload: function(err, buffer){
		t.equals(err,null, "Loading a valid URL without decode shouldn't error");
		t.ok(buffer instanceof ArrayBuffer, "Loading a valid URL without decode should return a ArrayBuffer");
	}, onprogress: function (event){
		if (event.loaded / event.total >= 1){
			t.pass("Throws per load onprogress events");
		}
	}});

	wal.load(invalidURL, {onload: function(err, buffer){
		t.ok(err instanceof Error, "Loading a invalid URL should error");
		t.equals(buffer,null, "Loading a invalid URL should return null");
	}});
});

test('WebAudioLoader Caching', function (t){
	beforeEach();
	t.plan(5);

	var validURL = "https://dl.dropboxusercontent.com/u/77191118/sounds/Sin440Hz1s-Original.wav";
	var validURL2 = "https://dl.dropboxusercontent.com/u/77191118/sounds/Sin440Hz1s-Original.mp3";
	var validUR3 = "https://dl.dropboxusercontent.com/u/77191118/sounds/sine_marked.mp3";
	//var hugeBuffer = "https://dl.dropboxusercontent.com/u/77191118/sounds/Sin440Hz1s-Marked.mp3";
	var wal = new WebAudioLoader();


	wal.load(validURL, {onload: function(){
		t.equals(window.webAudioLoader._cachedAudio.length, 1, "Loading should increase cache array length");
		wal.load(validURL, {onload: function(){
			t.equals(window.webAudioLoader._cachedAudio.length, 1, "Reloading should not increase cache array length");
			wal.load(validURL2, {onload: function(){
				t.equals(window.webAudioLoader._cachedAudio.length, 2, "Loading another should increase cache array length");
				wal.maxCacheSize = 500;
				wal.load(validUR3, {onload: function(){
					t.equals(window.webAudioLoader._cachedAudio.length, 2, "Going over the max size should an item to be deleted from cache");
					t.equals(window.webAudioLoader._cachedAudio[0].source, validURL2, "Going over the max size should cause the oldest item to be deleted from cache");
				}});
			}});
		}});
	}});
});

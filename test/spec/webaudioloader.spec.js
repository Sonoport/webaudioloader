var test = require('tape');
var report = require('browserify-tape-spec');
var WebAudioLoader = require('../../');


test('WebAudioLoader Constructor', function (t) {
    t.plan(1);

    t.doesNotThrow(function(){
    	var wal = new WebAudioLoader();
    },{}, "Initializes without error");
})

test.createStream().pipe(report('out'))

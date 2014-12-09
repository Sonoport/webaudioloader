var test = require('tape');
var report = require('browserify-tape-spec')

test('fibwibblers and xyrscawlers', function (t) {
    t.plan(2);

    t.equal(1,1, "yay");
    t.equal('a','a', "yay");

})

test.createStream().pipe(report('out'))

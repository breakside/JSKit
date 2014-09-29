// #import "JSKit/JSKit.js"

JSClass('UIAnimation', JSObject, {

    timingFunction: null,
    keyPath: null,
    fromValue: null,
    toValue: null,
    duration: null,

    initWithKeyPath: function(keyPath){
        self.keyPath = keyPath;
    }

});
// #import "JSObject.js"
'use strict';

(function(){

var initAllowed = false;

JSClass("JSRunLoop", JSObject, {

    init: function(){
        if (!initAllowed){
            throw new Error("Cannot instantiate a JSRunLoop, you must use JSRunLoop.main");
        }
        this._environmentInit();
    },

    _environmentInit: function(){

    },

    schedule: function(action, target){
    }

});

Object.defineProperties(JSRunLoop, {

    main: {
        configurable: true,
        get: function JSRunLoop_getMain(){
            initAllowed = true;
            var mainLoop = JSRunLoop.init();
            initAllowed = false;
            Object.defineProperty(JSRunLoop, 'main', {value: mainLoop});
            return mainLoop;
        }
    }

});

})();
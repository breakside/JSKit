// #import "JSKit/JSObject.js"

JSClass('UIEvent', JSObject, {

    initWithDOMEvent: function(domEvent){
        UIEvent.$super.init.call(this);
    }

});

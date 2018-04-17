// #import "Foundation/Foundation.js"
/* global JSClass, JSObject, JSReadOnlyProperty, JSDynamicProperty, JSRect */
'use strict';

JSClass("UIScreen", JSObject, {

    scale: JSReadOnlyProperty('_scale', 1),
    frame: JSDynamicProperty('_frame', null),
    availableFrame: JSReadOnlyProperty(),

    initWithFrame: function(frame, scale){
        this._scale = scale;
        this._frame = JSRect(frame);
    },

    getAvailableFrame: function(){
        return JSRect(this.frame);
    }

});
// #import Foundation
'use strict';

JSClass("UIScreen", JSObject, {

    scale: JSReadOnlyProperty('_scale', 1),
    frame: JSDynamicProperty('_frame', null),
    availableInsets: JSDynamicProperty('_availableInsets', null),
    availableFrame: JSReadOnlyProperty(),

    initWithFrame: function(frame, scale){
        this._scale = scale;
        this._frame = JSRect(frame);
        this._availableInsets = JSInsets.Zero;
    },

    getAvailableFrame: function(){
        return this.frame.rectWithInsets(this._availableInsets);
    },

    setAvailableInsets: function(availableInsets){
        this._availableInsets = JSInsets(availableInsets);
    }

});
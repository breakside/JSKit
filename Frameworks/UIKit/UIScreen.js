// #import Foundation
// #import "UIUserInterface.js"
'use strict';

JSClass("UIScreen", JSObject, {

    scale: JSReadOnlyProperty('_scale', 1),
    frame: JSDynamicProperty('_frame', null),
    availableInsets: JSDynamicProperty('_availableInsets', null),
    availableFrame: JSReadOnlyProperty(),
    verticalSizeClass: JSReadOnlyProperty('_verticalSizeClass', UIUserInterface.SizeClass.unspecified),
    horizontalSizeClass: JSReadOnlyProperty('_horizontalSizeClass', UIUserInterface.SizeClass.unspecified),

    initWithFrame: function(frame, scale){
        this._scale = scale;
        this.frame = frame;
        this._availableInsets = JSInsets.Zero;
    },

    getAvailableFrame: function(){
        return this.frame.rectWithInsets(this._availableInsets);
    },

    setAvailableInsets: function(availableInsets){
        this._availableInsets = JSInsets(availableInsets);
    },

    setFrame: function(frame){
        this._frame = JSRect(frame);
        if (this._frame.size.width < 550){
            this._horizontalSizeClass = UIUserInterface.SizeClass.compact;
        }else{
            this._horizontalSizeClass = UIUserInterface.SizeClass.regular;
        }
        if (this._frame.size.height < 550){
            this._verticalSizeClass = UIUserInterface.SizeClass.compact;
        }else{
            this._verticalSizeClass = UIUserInterface.SizeClass.regular;
        }
    }

});
// #import Foundation
// #import "UIUserInterface.js"
// #import "UITraitCollection.js"
'use strict';

JSClass("UIScreen", JSObject, {

    scale: JSReadOnlyProperty('_scale', 1),
    frame: JSDynamicProperty('_frame', null),
    availableInsets: JSDynamicProperty('_availableInsets', null),
    availableFrame: JSReadOnlyProperty(),

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
        this._setTraitCollection(UITraitCollection.initWithSize(this.frame.size));
    },
    
    traitCollection: JSReadOnlyProperty('_traitCollection', null),

    _setTraitCollection: function(traitCollection){
        var previous = this._traitCollection;
        this._traitCollection = traitCollection;
        if (previous !== null && !previous.isEqual(this._traitCollection)){
            this.traitCollectionDidChange(previous);
        }
    },

    traitCollectionDidChange: function(){
    }

});
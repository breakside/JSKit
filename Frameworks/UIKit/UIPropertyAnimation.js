// #import "UIKit/UIAnimation.js"
/* global JSClass, UIAnimation, JSDynamicProperty, JSResolveDottedName */
'use strict';

JSClass('UIPropertyAnimation', UIAnimation, {
    keyPath: null,
    _updateContext: null,
    _updateProperty: null,
    layer: JSDynamicProperty('_layer', null),  // FIXME: need to redeclare because setLayer is overwritten

    initWithKeyPath: function(keyPath){
        this.keyPath = keyPath;
    },

    setLayer: function(layer){
        this._layer = layer;
        var parts = this.keyPath.split('.');
        this._updateProperty = parts.pop();
        this._updateContext = JSResolveDottedName(layer.presentation, parts.join('.'));
    },

    getLayer: function(){
        return this._layer;
    }
});
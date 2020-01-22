// #import "UIAnimation.js"
'use strict';

JSClass('UIPropertyAnimation', UIAnimation, {
    keyPath: null,
    updateContext: JSReadOnlyProperty('_updateContext', null),
    updateProperty: JSReadOnlyProperty('_updateProperty', null),
    layer: JSDynamicProperty('_layer', null),

    initWithKeyPath: function(keyPath){
        this.keyPath = keyPath;
    },

    setLayer: function(layer){
        this._layer = layer;
        if (layer === null){
            this._updateProperty = null;
            this._updateContext = null;
        }else{
            var parts = this.keyPath.split('.');
            this._updateProperty = parts.pop();
            this._updateContext = JSResolveDottedName(layer.presentation, parts.join('.'));
        }
    },

    getLayer: function(){
        return this._layer;
    }
});
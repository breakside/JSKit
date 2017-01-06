// #import "UIKit/UILayer.js"
/* global JSClass, UILayer, UIImageLayer, UILayerAnimatedProperty, JSPoint, JSSize, JSDynamicProperty */
'use strict';

JSClass("UIImageLayer", UILayer, {

    image: JSDynamicProperty('_image', null),

    getImage: function(){
        return this._image;
    },

    setImage: function(image){
        this._image = image;
        this.didChangeProperty('image');
    }

});
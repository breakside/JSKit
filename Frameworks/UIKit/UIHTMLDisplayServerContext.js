// #import "Foundation/Foundation.js"
// #import "UIKit/UIView.js"
/* global JSClass, JSContext, JSObject, UILayer, UIHTMLDisplayServerContext, JSCustomProperty, JSDynamicProperty, JSLazyInitProperty, JSPoint, JSContextLineDash, UIView */
'use strict';


JSClass("UIHTMLDisplayServerContext", JSContext, {

    displayServer: null,
    element: null,
    needsCustomDisplay: false,
    firstSublayerNodeIndex: 0,
    layerManagedNodeCount: 0,

    drawsHiddenLayers: true,

    initScreenInContainer: function(containerElement){
    },

    initForScreenContext: function(screenContext){
    },

    setOrigin: function(origin){
    },

    setSize: function(size){
    },

    layerDidChangeProperty: function(layer, property){
    },

    startMouseTracking: function(trackingType, listener){
    },

    stopMouseTracking: function(){
    },

    addExternalElementInRect: function(element, rect){
    },

    destroy: function(){
        this.element = null;
    }

});
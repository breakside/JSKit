// #import Foundation
// #import "UIView.js"
// jshint browser: true
'use strict';


JSClass("UIHTMLDisplayServerContext", JSContext, {

    displayServer: null,
    element: null,
    needsCustomDisplay: false,
    hasDragEvents: false,

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

    insertSublayerContext: function(sublayer, context){
    },

    destroy: function(){
        this.element = null;
    }

});
// #import "Foundation/Foundation.js"
// #import "UIKit/UIView.js"
/* global JSClass, JSContext, JSObject, UILayer, UIHTMLDisplayServerContext, JSCustomProperty, JSDynamicProperty, JSLazyInitProperty, JSPoint, JSContextLineDash, UIView */
'use strict';


JSClass("UIHTMLDisplayServerContext", JSContext, {

    displayServer: null,
    element: null,
    style: null,
    needsCustomDisplay: false,
    firstSublayerNodeIndex: 0,
    layerManagedNodeCount: 0,

    initWithElementUnmodified: function(element){
        UIHTMLDisplayServerContext.$super.init.call(this);
        this.element = element;
        this.style = this.element.style;
    },

    initWithElement: function(element){
        this.initWithElementUnmodified(element);
        this.style.position = 'absolute';
        this.style.boxSizing = 'border-box';
        this.style.mozBoxSizing = 'border-box';
        this.style.touchAction = 'none';
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
        this.style = null;
    }

});
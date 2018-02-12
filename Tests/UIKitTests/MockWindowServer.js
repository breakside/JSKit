// #import "UIKit/UIKit.js"
/* global JSClass, setTimeout, UIDisplayServer, JSTextFramesetter, MockDisplayContext, UITextInputManager, MockTextInputManager, JSContext, UIWindowServer, MockWindowServer, MockDisplayServer */
'use strict';

JSClass("MockWindowServer", UIWindowServer, {

    init: function(rootElement){
        MockWindowServer.$super.init.call(this);
        this.displayServer = MockDisplayServer.init();
        this.textInputManager = MockTextInputManager.init();
        this.textInputManager.windowServer = this;
    },

});

JSClass("MockDisplayServer", UIDisplayServer, {

    rootContext: null,
    rootLayers: null,
    contextsByLayerID: null,
    updateNeeded: true,

    init: function(){
        MockDisplayServer.$super.init.call(this);
        this.rootLayers = [];
        this.contextsByLayerID = {};
        this.rootContext = MockDisplayContext.init();
    },

    layerInserted: function(layer){
        layer._displayServer = this;
        var parentContext;
        if (layer.superlayer){
            parentContext = this.contextsByLayerID[layer.superlayer.objectID];
        }else{
            parentContext = this.rootContext;
            this.rootLayers.push(layer);
        }
        if (parentContext){
            var context = this.contextForLayer(layer);
            if (layer._needsLayout){
                this.setLayerNeedsLayout(layer);
                layer._needsLayout = false;
            }
            this.setLayerNeedsReposition(layer);
            this.setLayerNeedsDisplay(layer);
            for (var i = 0, l = layer.sublayers.length; i < l; ++i){
                this.layerInserted(layer.sublayers[i]);
            }
        }else{
            throw new Error("layerInserted called without valid parent context");
        }
    },

    layerRemoved: function(layer){
        if (this.contextsByLayerID[layer.objectID]){
            delete this.contextsByLayerID[layer.objectID];
        }
        if (layer.superlayer === null){
            for (var i = this.rootLayers.length - 1; i >= 0; --i){
                this.rootLayers.splice(i, 1);
                break;
            }
        }
        layer._displayServer = null;
    },

    setUpdateNeeded: function(){
        this.updateNeeded = true;
    },

    updateDisplay: function(t){
        MockDisplayServer.$super.updateDisplay.call(this, t);
        this.updateNeeded = false;
    },

    contextForLayer: function(layer){
        var context = this.contextsByLayerID[layer.objectID];
        if (context === undefined){
            context = MockDisplayContext.init();
            this.contextsByLayerID[layer.objectID] = context;
        }
        return context;
    },

    positionLayer: function(layer){
    },

    createTextFramesetter: function(){
        return JSTextFramesetter.init();
    }

});

JSClass("MockTextInputManager", UITextInputManager, {

    responder: null,

    windowDidChangeResponder: function(window){
        this.responder = window.firstResponder;
    }

});

JSClass("MockDisplayContext", JSContext, {

});
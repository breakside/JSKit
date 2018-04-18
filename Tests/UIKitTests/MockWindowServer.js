// #import "UIKit/UIKit.js"
/* global JSClass, setTimeout, UIDisplayServer, JSTextFramesetter, MockDisplayContext, UITextInputManager, MockTextInputManager, JSContext, UIWindowServer, MockWindowServer, MockDisplayServer, UIScreen, JSRect */
'use strict';

JSClass("MockWindowServer", UIWindowServer, {

    init: function(rootElement){
        MockWindowServer.$super.init.call(this);
        this.displayServer = MockDisplayServer.init();
        this.textInputManager = MockTextInputManager.init();
        this.textInputManager.windowServer = this;
        this.screen = UIScreen.initWithFrame(JSRect(0, 0, 1500, 1000));
    },

});

JSClass("MockDisplayServer", UIDisplayServer, {

    rootContext: null,
    rootLayers: null,
    contextsByObjectID: null,
    updateNeeded: true,
    layerChangeCallback: null,

    init: function(){
        MockDisplayServer.$super.init.call(this);
        this.rootLayers = [];
        this.contextsByObjectID = {};
        this.rootContext = MockDisplayContext.init();
    },

    windowInserted: function(window){
        this.rootLayers.push(window.layer);
        this._layerInserted(window.layer, this.rootContext);
    },

    layerInserted: function(layer){
        if (!layer.superlayer){
            this._layerInserted(layer, this.rootContext);
        }else{
            var parentContext = this.contextsByObjectID[layer.superlayer.objectID];
            if (!parentContext){
                throw new Error("Cannot insert a layer without a superlayer also inserted.");
            }
            this._layerInserted(layer, parentContext);
        }
    },

    _layerInserted: function(layer, parentContext){
        layer._displayServer = this;
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
    },

    layerRemoved: function(layer){
        if (this.contextsByObjectID[layer.objectID]){
            delete this.contextsByObjectID[layer.objectID];
        }
        if (layer.superlayer === null){
            for (var i = this.rootLayers.length - 1; i >= 0; --i){
                this.rootLayers.splice(i, 1);
                break;
            }
        }
        layer._displayServer = null;
    },

    layerDidChangeProperty: function(layer, keyPath){
        if (this.layerChangeCallback !== null){
            this.layerChangeCallback.call(layer, keyPath);
        }
        MockDisplayServer.$super.layerDidChangeProperty.call(this, layer, keyPath);
    },

    setUpdateNeeded: function(){
        this.updateNeeded = true;
    },

    updateDisplay: function(t){
        MockDisplayServer.$super.updateDisplay.call(this, t);
        this.updateNeeded = false;
    },

    contextForLayer: function(layer){
        var context = this.contextsByObjectID[layer.objectID];
        if (context === undefined){
            context = MockDisplayContext.init();
            this.contextsByObjectID[layer.objectID] = context;
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
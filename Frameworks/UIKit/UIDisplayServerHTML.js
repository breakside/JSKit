// #import "UIKit/UIDisplayServer.js"
// #import "UIKit/UIHTMLContext.js"
// #feature Window.prototype.addEventListener
// #feature window.getComputedStyle
// #feature window.requestAnimationFrame
// #feature Document.prototype.createElement
/* global JSClass, UIDisplayServer, UIDisplayServerHTML, UIHTMLContext, JSSize */
'use strict';

JSClass("UIDisplayServerHTML", UIDisplayServer, {

    domWindow: null,
    domDocument: null,
    rootElement: null,
    rootLayers: null,
    rootContext: null,
    environmentSize: null,
    displayFrameID: null,
    _displayFrameBound: null,
    contextsByLayerID: null,

    // -------------------------------------------------------------------------
    // MARK: - HTML Display Setup

    initWithRootElement: function(rootElement){
        UIDisplayServerHTML.$super.init.call(this);
        this.rootElement = rootElement;
        this.domDocument = this.rootElement.ownerDocument;
        this.domWindow = this.domDocument.defaultView;
        this.rootLayers = [];
        this.contextsByLayerID = {};
        this._displayFrameBound = this.displayFrame.bind(this);
        this.setupRenderingEnvironment();
    },

    setupRenderingEnvironment: function(){
        this.rootContext = UIHTMLContext.initWithElement(this.rootElement);
        if (this.rootElement === this.domDocument.body){
            var body = this.rootElement;
            var html = this.domDocument.documentElement;
            body.style.padding = '0';
            html.style.padding = '0';
            body.style.margin = '0';
            html.style.margin = '0';
            body.style.height = '100%';
            html.style.height = '100%';
            html.style.overflow = 'hidden';
            body.style.overflow = 'hidden';
        }else{
            var style = this.domWindow.getComputedStyle(this.rootElement);
            if (style.position != 'absolute' && style.position != 'relative' && style.position != 'fixed'){
                this.rootElement.style.position = 'relative';
            }
        }
        this.rootElement.style.fontFamily = '"San Francisco", "Helvetica Neue", "Helvetica", sans-serif';
        this.rootElement.style.fontSize = '14px';
        this.rootElement.style.fontWeight = 300;
        this.rootElement.style.lineHeight = '19px';
        this.rootElement.style.cursor = 'default';
        this._determineEnvironmentSize();
        this.setupEventListeners();
    },

    // -------------------------------------------------------------------------
    // MARK: - Display-related Events

    setupEventListeners: function(){
        this.domWindow.addEventListener('resize', this, false);
    },

    handleEvent: function(e){
        this[e.type](e);
    },

    resize: function(e){
        if (e.currentTarget === this.domWindow){
            this._determineEnvironmentSize();
            var layer;
            for (var i = 0, l = this.rootLayers.length; i < l; ++i){
                layer = this.rootLayers[i];
                if (layer.constraintBox){
                    layer._updateFrameAfterSuperSizeChange(this.environmentSize);
                }
            }
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Display Cycle

    setDisplayNeeded: function(){
        this.requestDisplayFrame();
    },

    requestDisplayFrame: function(){
        if (this.displayFrameID === null){
            this.displayFrameID = this.domWindow.requestAnimationFrame(this._displayFrameBound);
        }
    },

    displayFrame: function(t){
        this.displayFrameID = null;
        this.updateDisplay(t);
    },

    _displayLayerQueueEntry: function(entry){
        var context = this._contextForLayer(entry.layer);
        entry.layer.updatePropertiesInHTMLContext(context, entry.properties);
        if (entry.redraw){
            entry.layer.drawInContext(context);
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Layer Upates

    setLayerNeedsDisplayForProperty: function(layer, keyPath){
        if (keyPath === 'superlayer.bounds.size'){
            // superlayer.bounds.size is a special keyPath used when the superlayer of a
            // layer with a constraint box changes its bounds size, affecting the sublayer's
            // layout based on the constraints specified on the sublayer and the new size.
            // Because of the way we assign CSS positional styles for a constraint box,
            // specifically that CSS already does the exact same calculation we do,
            // There's no CSS that needs to change in this case, so we won't queue anything.
            return;
        }
        if (keyPath == 'shadowColor' || keyPath == 'shadowOffset' || keyPath == 'shadowRadius'){
            // Because the boxShadow property in CSS is a single property, and the combination
            // of several UILayer properties, we'll treat any shadow-related property as the same
            // thing so only one update gets queued.
            keyPath = 'shadow';
        }
        if (keyPath == 'frame' || keyPath == 'position' || keyPath == 'constraintBox'){
            // Changes to any of these UILayer properties triggers the same CSS updates, so
            // we'll treat them as the same thing so only one update gets queued.
            keyPath = 'box';
        }
        UIDisplayServerHTML.$super.setLayerNeedsDisplayForProperty.call(this, layer, keyPath);
    },

    // -------------------------------------------------------------------------
    // MARK: - Notifications

    layerInserted: function(layer){
        var parentContext;
        if (layer.superlayer){
            parentContext = this.contextsByLayerID[layer.superlayer.objectID];
        }else{
            parentContext = this.rootContext;
            this.rootLayers.push(layer);
            layer._updateFrameAfterSuperSizeChange(this.environmentSize);
        }
        if (parentContext){
            var context = this._contextForLayer(layer);
            var insertIndex = parentContext.firstSublayerNodeIndex + layer.level;
            if (insertIndex < parentContext.element.childNodes.length){
                parentContext.element.insertBefore(context.element, parentContext.element.childNodes[insertIndex]);
            }else{
                parentContext.element.appendChild(context.element);
            }
            context.firstSublayerNodeIndex = context.element.childNodes.length;
            for (var i = 0, l = layer.sublayers.length; i < l; ++i){
                this.layerInserted(layer.sublayers[i]);
            }
        }
    },

    layerRemoved: function(layer){
        var context = this.contextsByLayerID[layer.objectID];
        if (context){
            if (context.element.parentNode){
                context.element.parentNode.removeChild(context.element);
            }
            // FIXME: when a view is just moving to a new superview, we shouldn't destroy the context
            context.destroy();
            delete this.contextsByLayerID[layer.objectID];
        }
        if (layer.superlayer === null){
            for (var i = this.rootLayers.length - 1; i >= 0; --i){
                this.rootLayers.splice(i, 1);
                break;
            }
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Private Helpers

    _determineEnvironmentSize: function(){
        this.environmentSize = JSSize(this.rootElement.offsetWidth, this.rootElement.offsetHeight);
    },

    _contextForLayer: function(layer){
        var context = this.contextsByLayerID[layer.objectID];
        if (context === undefined){
            var element = this.domDocument.createElement('div');
            context = UIHTMLContext.initWithElement(element);
            if (element.dataset){
                element.dataset.layerId = layer.objectID;
                if (layer.delegate !== null){
                    element.dataset.viewClass = layer.delegate.$class.className;
                }
            }
            this.contextsByLayerID[layer.objectID] = context;
            layer.initializeHTMLContext(context);
        }
        return context;
    }

});
// #import "UIKit/UIRenderer.js"
// #import "UIKit/UIHTMLRendererContext.js"
// #import "UIKit/UIEvent.js"
// #import "UIKit/UIWindowServer.js"
// #feature Window.prototype.addEventListener
// #feature window.getComputedStyle
// #feature window.requestAnimationFrame
// #feature Document.prototype.createElement
// #feature Element.prototype.addEventListener
/* global JSClass, UIRenderer, UIHTMLRenderer, UIHTMLRendererContext, UIWindowServer, JSSize, JSConstraintBox, UIScrollLayer, UITextLayer, UIEvent, JSPoint */
'use strict';

JSClass("UIHTMLRenderer", UIRenderer, {

    domWindow: null,
    domDocument: null,
    rootElement: null,
    rootLayers: null,
    rootContext: null,
    environmentSize: null,
    displayFrameID: null,
    _displayFrameBound: null,
    contextsByLayerID: null,

    initWithRootElement: function(rootElement){
        UIHTMLRenderer.$super.init.call(this);
        this.rootElement = rootElement;
        this.domDocument = this.rootElement.ownerDocument;
        this.domWindow = this.domDocument.defaultView;
        this.rootLayers = [];
        this.contextsByLayerID = {};
        this._displayFrameBound = this.displayFrame.bind(this);
        this.setupRenderingEnvironment();
    },

    setupRenderingEnvironment: function(){
        this.rootContext = UIHTMLRendererContext.initWithElement(this.rootElement);
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
        this.determineEnvironmentSize();
        this.setupEventListeners();
    },

    setupEventListeners: function(){
        this.domWindow.addEventListener('resize', this, false);
        this.rootElement.addEventListener('mousedown', this, false);
        this.rootElement.addEventListener('mouseup', this, false);
        this.rootElement.addEventListener('keydown', this, false);
        this.rootElement.addEventListener('keyup', this, false);
        this.rootElement.addEventListener('keypress', this, false);
        this.rootElement.addEventListener('dragstart', this, false);
        this.rootElement.addEventListener('dragend', this, false);
        // TODO: efficient mousemove (look into tracking areas)
        // TODO: mouse enter/exit (look into tracking areas)
        // TODO: dragging
        // TODO: special things like file input change
        // TODO: DOM 3 Key Events (if supported)
        // TODO: touch events?
        // TODO: copy/paste
        // TODO: does stopping key events interfere with browser keyboard shortcuts?
        // TODO: mouse leaving document (e.g., can't track mouseup outside document)
    },

    handleEvent: function(e){
        this[e.type](e);
        // FIXME: I think stopping a mousedown in Firefox prevents dragstart from working
        e.stopPropagation();
        if (e.cancelable){
            e.preventDefault();
        }
    },

    resize: function(e){
        if (e.currentTarget === this.domWindow){
            this.determineEnvironmentSize();
            var layer;
            for (var i = 0, l = this.rootLayers.length; i < l; ++i){
                layer = this.rootLayers[i];
                if (layer.constraintBox){
                    layer._updateFrameAfterSuperSizeChange(this.environmentSize);
                }
            }
        }
    },

    _isMouseDown: false,

    mousedown: function(e){
        if (e.button === 0){
            this._isMouseDown = true;
            this._createMouseEventFromDOMEvent(e, UIEvent.Type.MouseDown);
        }
    },

    mouseup: function(e){
        if (this._isMouseDown && e.button === 0){
            this._isMouseDown = false;
            this._createMouseEventFromDOMEvent(e, UIEvent.Type.MouseUp);
        }
    },

    _createMouseEventFromDOMEvent: function(e, type){
        var location = this._locationOfDOMEventInScreen(e);
        var window = UIWindowServer.defaultServer.windowAtScreenLocation(location);
        if (window !== null){
            var timestamp = e.timeStamp / 1000.0;
            var event = UIEvent.initMouseEventWithType(type, timestamp, window, window.convertPointFromScreen(location));
            window.application.sendEvent(event);
        }
    },

    keydown: function(e){
    },

    keyup: function(e){
    },

    keypress: function(e){
    },

    dragstart: function(e){
    },

    dragend: function(e){
    },

    _locationOfDOMEventInScreen: function(e){
        var screenBoundingRect = this.rootElement.getBoundingClientRect();
        return JSPoint(e.clientX - screenBoundingRect.x, e.clientY - screenBoundingRect.y);
    },

    determineEnvironmentSize: function(){
        this.environmentSize = JSSize(this.rootElement.offsetWidth, this.rootElement.offsetHeight);
    },

    setDisplayNeeded: function(){
        this.requestDisplayFrame();
    },

    displayFrame: function(t){
        this.displayFrameID = null;
        this.updateDisplay(t);
    },

    requestDisplayFrame: function(){
        if (this.displayFrameID === null){
            this.displayFrameID = this.domWindow.requestAnimationFrame(this._displayFrameBound);
        }
    },

    viewInserted: function(view){
        var context = this.contextForLayer(view.layer);
        if (context.element.dataset){
            context.element.dataset.viewClass = view.$class.className;
        }
    },

    viewRemoved: function(view){
    },

    layerCreated: function(layer){
        var context = this.contextForLayer(layer);
        layer.renderInHTMLContext(context);
    },

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
            var context = this.contextForLayer(layer);
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

    contextForLayer: function(layer){
        if (layer.objectID in this.contextsByLayerID){
            return this.contextsByLayerID[layer.objectID];
        }
        var element = this.domDocument.createElement('div');
        var context = UIHTMLRendererContext.initWithElement(element);
        if (element.dataset){
            element.dataset.layerId = layer.objectID;
        }
        this.contextsByLayerID[layer.objectID] = context;
        return context;
    },

    setLayerNeedsRenderForKeyPath: function(layer, keyPath){
        if (keyPath === 'superlayer.frame.size'){
            // superlayer.frame.size is a special keyPath used when the superlayer of a
            // layer with a constraint box changes its frame size, affecting the sublayer's
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
        UIHTMLRenderer.$super.setLayerNeedsRenderForKeyPath.call(this, layer, keyPath);
    },

    _flushLayerRenderQueue: function(){
        var layer;
        var properties;
        var context;
        for (var id in this.layerRenderQueue){
            layer = this.layerRenderQueue[id].layer;
            context = this.contextForLayer(layer);
            properties = this.layerRenderQueue[id].properties;
            layer.displayInHTMLContext(context, properties);
        }
        this.layerRenderQueue = {};
    }

});
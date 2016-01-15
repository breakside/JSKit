// #import "UIKit/UIRenderer.js"
// #import "UIKit/UIHTMLRendererContext.js"
// #import "UIKit/UIEvent.js"
// #feature Window.prototype.addEventListener
// #feature window.getComputedStyle
// #feature Window.prototype.requestAnimationFrame
// #feature Document.prototype.createElement
// #feature Element.prototype.addEventListener
/* global JSClass, UIRenderer, UIHTMLRenderer, UIHTMLRendererContext, JSSize, JSConstraintBox, UIScrollLayer, UITextLayer, UIEvent */
'use strict';

JSClass("UIHTMLRenderer", UIRenderer, {

    domWindow: null,
    domDocument: null,
    rootElement: null,
    rootLayer: null,
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
        this.rootLayer = null;
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
        this.determineEnvironmentSize();
        this.setupEventListeners();
    },

    setupEventListeners: function(){
        this.domWindow.addEventListener('resize', this, false);
        this.rootElement.addEventListener('mousedown', this, false);
        this.rootElement.addEventListener('mouseup', this, false);
        this.rootElement.addEventListener('click', this, false);
        this.rootElement.addEventListener('dblclick', this, false);
        this.rootElement.addEventListener('keydown', this, false);
        this.rootElement.addEventListener('keyup', this, false);
        this.rootElement.addEventListener('keypress', this, false);
        this.rootElement.addEventListener('dragstart', this, false);
        this.rootElement.addEventListener('dragend', this, false);
        // TODO: efficient mousemove
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
            if (this.rootLayer.constraintBox){
                this.rootLayer._updateFrameAfterSuperSizeChange(this.environmentSize);
            }
        }
    },

    mousedown: function(e){
    },

    mouseup: function(e){
    },

    click: function(e){
    },

    dblclick: function(e){
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

    layerInserted: function(layer){
        var parentContext;
        if (layer.superlayer){
            parentContext = this.contextsByLayerID[layer.superlayer.objectID];
        }else{
            parentContext = this.rootContext;
            this.rootLayer = layer;
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
            layer.renderInHTMLContext(context);
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
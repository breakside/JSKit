// #import "UILayer.js"
/* global UIHTMLDisplayServerCanvasContext */
'use strict';

JSClass("UIHTMLElementLayer", UILayer, {

    init: function(){
        UIHTMLElementLayer.$super.init.call(this);
        this.elementInsets = JSInsets.Zero;
    },

    element: null,
    elementInsets: JSDynamicProperty('_elementInsets', null),

    didChangeSize: function(){
        UIHTMLElementLayer.$super.didChangeSize.call(this);
        this.setNeedsDisplay();
    },

    setElementInsets: function(elementInsets){
        this._elementInsets = JSInsets(elementInsets);
        this.setNeedsDisplay();
    },

    createElement: function(document){
        var name = "div";
        if (this.delegate && this.delegate.elementNameForLayer){
            name = this.delegate.elementNameForLayer(this);
        }
        this.element = document.createElement(name);
        this.didCreateElement();
        this.setNeedsDisplay();
    },

    didCreateElement: function(){
        if (this.delegate && this.delegate.layerDidCreateElement){
            this.delegate.layerDidCreateElement(this);
        }
    },

    willDestroyElement: function(){
        if (this.delegate && this.delegate.layerWillDestroyElement){
            this.delegate.layerWillDestroyElement(this);
        }
    },

    drawInContext: function(context){
        if (context.isKindOfClass(UIHTMLDisplayServerCanvasContext)){
            context.addExternalElementInRect(this.element, this.bounds.rectWithInsets(this.elementInsets));
        }
    },

});
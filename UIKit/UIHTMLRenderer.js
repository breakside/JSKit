// #import "UIKit/UIRenderer.js"

JSClass("UIHTMLRenderer", UIRenderer, {

    domWindow: null,
    domDocument: null,
    domBody: null,
    _handleEventBound: null,
    domEventMethodMap: {
        'mousedown'     : 'mouseDown',
        'mouseup'       : 'mouseUp',
        'mousemove'     : 'mouseMoved',
        'mouseover'     : 'mouseEntered',
        'mouseout'      : 'mouseExited'
    },

    initWithDOMWindow: function(domWindow){
        this.domWindow = domWindow;
        this.domDocument = domWindow.document;
        this.domBody = this.domDocument.body;
        this._handleEventBound = this.handleEvent.bind(this);
    },

    viewInserted: function(view){
        var element = this.elementForLayer(view.layer);
        if (element){
            for (var eventType in this.domEventMethodMap){
                if (this.domEventMethodMap[eventType] in view){
                    element.addEventListener(eventType, this._handleEventBound, false);
                    element._view = view;
                }
            }
            for (var i = 0, l = view.subviews.length; i < l; ++i){
                this.viewInserted(view.subviews[i]);
            }
        }
    },

    layerInserted: function(layer){
        var parentElement;
        if (view.superview){
            parentElement = this.elementForLayer(layer.superlayer);
        }else{
            parentElement = this.domBody;
        }
        if (parentElement){
            var element = this.domDocument.createElement('div');
            element._firstSubviewNodeIndex = 0;
            element.style.boxSizing = 'border-box';
            element.style.mozBoxSizing = 'border-box';
            element.setAttribute('UIViewClass', view.$class.className);
            element.id = 'UILayer-' + layer.objectID;
            var insertIndex = parentElement._firstSubviewNodeIndex + layer.level;
            if (insertIndex < parentElement.childNodes.length){
                parentElement.insertBefore(element, parentElement.childNodes[insertIndex]);
            }else{
                parentElement.appendChild(element);
            }
            for (var i = 0, l = layer.sublayers.length; i < l; ++i){
                this.layerInserted(layer.sublayers[i]);
            }
        }
    },

    viewRemoved: function(view){
    },

    layerRemoved: function(layer){
        var element = this.elementForLayer(layer);
        if (element){
            element.parentNode.removeChild(element);
        }
    },

    elementForLayer: function(layer){
        this.domDocument.getElementById('UILayer-' + layer.objectID);
    },

    handleEvent: function(domEvent){
        var element = domEvent.currentTarget;
        var view = element._view;
        var methodName = this.domEventMethodMap[domEvent.type.lower()];
        var event = UIEvent.init();
        view[methodName](event);
        domEvent.stopPropagation();
    },

    requestDisplayFrame: function(){
        if (!this.displayFrameID){
            this.displayFrameID = requestAnimationFrame(this._displayFrameBound);
        }
    }

});

UIRenderer.environmentRenderers['HTML'] = UIHTMLRenderer.initWithDOMWindow(window);
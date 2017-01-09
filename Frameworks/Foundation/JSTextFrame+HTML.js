// #import "Foundation/JSTextFrame.js"
/* global JSClass, JSTextFrame, JSRect, JSDynamicProperty, JSAttributedString, JSClassFromName */
'use strict';

JSTextFrame.definePropertiesFromExtensions({

    _reusableRunRenderers: null,
    _runRenderers: null,
    _element: null,
    _textChangedSinceLastDraw: false,

    init: function(){
        this._init();
        this._reusableRunRenderers = {};
        this._runRenderers = [];
    },

    didChangeBounds: function(){
        if (this._element !== null){
            this._layout();
        }
    },

    didChangeText: function(){
        this._textChangedSinceLastDraw = true;
    },

    _layout: function(){
        if (this._element !== null){
            this._element.style.left = this._bounds.origin.x + 'px';
            this._element.style.top = this._bounds.origin.y + 'px';
            this._element.style.width = this._bounds.size.width + 'px';
            this._element.style.height = this._bounds.size.height + 'px';
        }
    },

    characterIndexAtPoint: function(point){
    },

    drawInContext: function(context){
        if (context.isKindOfClass(UIHTMLDisplayServerContext)){
            this._drawInHTMLContext(context);
        }else{
            this._drawInGenericContext(context);
        }
    },

    _drawInHTMLContext: function(context){
        if (!this._textChangedSinceLastDraw){
            return;
        }
        this._textChangedSinceLastDraw = false;
        // Assuming we're only called with a JSHTMLContext
        if (this._element === null){
            this._element = context.element.ownerDocument.createElement('div');
            context.element.appendChild(this._element);
        }
        // FIXME: formalize the API for fetching runs
        var runs = this.attributedText._runs;
        var nativeString = this.attributedText.string.nativeString;
        var run;
        var identifier;
        var renderer;
        var childIndex = 0;
        var childCount = this._element.childNodes.length;
        for (var i = this._runRenderers.length - 1; i >= 0; ++i){
            this.enqueueReusableRunRenderer(this._runRenderers[i]);
        }
        this._runRenderers = [];
        for (var runIndex = 0, runCount = runs.length; runIndex < runCount; ++runIndex){
            run = runs[runIndex];
            identifier = this.rendererIdentifierForRun(run);
            renderer = this.dequeueReusableRunRenderer(identifier);
            renderer.setTextAndAttributes(nativeString.substr(run.range.location, run.range.length), run.attributes);
            this._runRenderers.push(renderer);
            if (childIndex < childCount){
                if (this._element.childNodes[childIndex] !== renderer.element){
                    this._element.insertBefore(renderer.element, this._element.childNodes[childIndex]);
                }
            }else{
                this._element.appendChild(renderer.element);
                ++childCount;
            }
            ++childIndex;
        }
        for (var j = childCount - 1; j >= childIndex; --j){
            this._element.removeChild(this._element.childNodes[j]);
        }
    },

    rendererIdentifierForRun: function(run){
        // TODO: recognize attachment runs and use a different renderer
        for (var x in run.attributes){
            return 'JSTextFrameHTMLAttributedRunRenderer';
        }
        return 'JSTextFrameHTMLUnattributedRunRenderer';
    },

    enqueueReusableRunRenderer: function(renderer){
        var queue = this._reusableRunRenderers[renderer.identifier];
        if (queue === undefined){
            queue = [];
            this._reusableRunRenderers[renderer.identifier] = queue;
        }
        queue.push(renderer);
    },

    dequeueReusableRunRenderer: function(identifier){
        var queue = this._reusableRunRenderers[identifier];
        if (queue !== undefined && queue.length > 0){
            return this.queue.pop();

        }
        var cls = JSClassFromName(identifier);
        return new cls(this._element.ownerDocument, identifier);
    }
});

function JSTextFrameHTMLUnattributedRunRenderer(doc, identifier){
    if (this === undefined){
        return new JSTextFrameHTMLUnattributedRunRenderer(this);
    }
    this.element = doc.createTextNode('');
    this.identifier = identifier;
}

JSTextFrameHTMLUnattributedRunRenderer.prototype = {

    element: null,
    identifier: null,

    setTextAndAttributes: function(text, attributes){
        this.element.nodeValue = text;
    }

};

function JSTextFrameHTMLAttributedRunRenderer(doc, identifier){
    if (this === undefined){
        return new JSTextFrameHTMLAttributedRunRenderer(this);
    }
    this.element = doc.createElement('span');
    this.identifier = identifier;
    this.textNode = this.element.appendChild(doc.createTextNode(''));
}

JSTextFrameHTMLAttributedRunRenderer.prototype = {

    element: null,
    identifier: null,
    textNode: null,

    setTextAndAttributes: function(text, attributes){
        this.textNode.nodeValue = text;
        var style = this.element.style;
        style.fontWeight = attributes.bold === true ? 'bold' : '';
        style.fontStyle = attributes.italic === true ? 'italic' : '';
        style.textDecoration = attributes.underline === true ? 'underline' : '';
        style.fontFamily = attributes.fontFamily !== undefined ? attributes.fontFamily : '';
    }

};

function JSTextFrameHTMLAttachmentRunRenderer(doc, identifier){
    if (this === undefined){
        return new JSTextFrameHTMLAttachmentRunRenderer(this);
    }
    this.element = doc.createElement('div');
    this.element.style.display = 'inline';
    this.identifier = identifier;
}

JSTextFrameHTMLAttachmentRunRenderer.prototype = {

    element: null,
    identifier: null,

    setTextAndAttributes: function(text, attributes){
        // TODO: get view for attributes.attachment
    }

};
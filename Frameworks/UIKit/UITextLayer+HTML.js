// #import "UIKit/UITextLayer.js"
/* global JSClass, UITextLayer, JSClassFromName */
'use strict';

UITextLayer.definePropertiesFromExtensions({

    _reusableRunRenderers: null,

    renderInHTMLContext: function(context){
        UITextLayer.$super.renderInHTMLContext.call(this, context);
        context.runRenderers = [];
    },

    displayHTMLProperty_attributedText: function(context){
        // FIXME: formalize the API for fetching runs
        var runs = this.attributedText._runs;
        var nativeString = this.attributedText.string.nativeString;
        var run;
        var identifier;
        var renderer;
        var childIndex = 0;
        var childCount = context.element.childNodes.length;
        this.enqueueReusableRunRenderers(context.runRenderers);
        context.runRenderers = [];
        for (var runIndex = 0, runCount = runs.length; runIndex < runCount; ++runIndex){
            run = runs[runIndex];
            identifier = this.rendererIdentifierForRun(run);
            renderer = this.dequeueReusableRunRenderer(identifier, context);
            renderer.setTextAndAttributes(nativeString.substr(run.range.location, run.range.length), run.attributes);
            context.runRenderers.push(renderer);
            if (childIndex < childCount){
                if (context.childNodes[childIndex] !== renderer.element){
                    context.element.insertBefore(renderer.element, context.childNodes[childIndex]);
                }
            }else{
                context.element.appendChild(renderer.element);
                ++childCount;
            }
            ++childIndex;
        }
        for (var j = childCount - 1; j >= childIndex; --j){
            context.element.removeChild(context.element.childNodes[j]);
        }
    },

    displayHTMLProperty_textColor: function(context){
        context.element.style.color = this.presentation.textColor ? this.presentation.textColor.cssString() : '';
    },

    displayHTMLProperty_font: function(context){
        context.element.style.font = this.presentation.font ? this.presentation.font.cssString() : '';
    },

    rendererIdentifierForRun: function(run){
        // TODO: recognize attachment runs and use a different renderer
        for (var x in run.attributes){
            return 'UITextLayerHTMLAttributedRunRenderer';
        }
        return 'UITextLayerHTMLUnattributedRunRenderer';
    },

    enqueueReusableRunRenderers: function(renderers){
        if (this._reusableRunRenderers === null){
            this._reusableRunRenderers = [];
        }
        for (var i = renderers.length - 1; i >= 0; ++i){
            this._reusableRunRenderers.push(renderers[i]);
        }
    },

    dequeueReusableRunRenderer: function(identifier, context){
        if (this._reusableRunRenderers === null){
            this._reusableRunRenderers = [];
        }
        if (this._reusableRunRenderers.length > 0){
            return this._reusableRunRenderers.pop();
        }
        var cls = JSClassFromName(identifier);
        return new cls(context.element.ownerDocument);
    }

});

function UITextLayerHTMLUnattributedRunRenderer(doc){
    if (this === undefined){
        return new UITextLayerHTMLUnattributedRunRenderer(this);
    }
    this.element = doc.createTextNode('');
}

UITextLayerHTMLUnattributedRunRenderer.prototype = {

    element: null,

    setTextAndAttributes: function(text, attributes){
        this.element.nodeValue = text;
    }

};

function UITextLayerHTMLAttributedRunRenderer(doc){
    if (this === undefined){
        return new UITextLayerHTMLAttributedRunRenderer(this);
    }
    this.element = doc.createElement('span');
    this.textNode = this.element.appendChild(doc.createTextNode(''));
}

UITextLayerHTMLAttributedRunRenderer.prototype = {

    element: null,
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

function UITextLayerHTMLAttachmentRunRenderer(doc){
    if (this === undefined){
        return new UITextLayerHTMLAttachmentRunRenderer(this);
    }
    this.element = doc.createElement('div');
    this.element.style.display = 'inline';
}

UITextLayerHTMLAttachmentRunRenderer.prototype = {

    element: null,

    setTextAndAttributes: function(text, attributes){
        // TODO: get view for attributes.attachment
    }

};

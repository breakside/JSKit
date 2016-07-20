// #import "UIKit/UITextLayer.js"
/* global JSClass, UITextLayer */
'use strict';

UITextLayer.definePropertiesFromExtensions({

    renderInHTMLContext: function(context){
        UITextLayer.$super.renderInHTMLContext.call(this, context);
        var element = context.element;
        context.textNode = element.appendChild(element.ownerDocument.createTextNode(''));
    },

    displayHTMLProperty_text: function(context){
        context.textNode.nodeValue = this.text.nativeString;
    },

    displayHTMLProperty_textColor: function(context){
        context.style.color = this.presentation.textColor ? this.presentation.textColor.cssString() : '';
    }

});
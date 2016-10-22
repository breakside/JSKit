// #import "UIKit/UITextLayer.js"
/* global JSClass, UITextLayer, JSClassFromName */
'use strict';

UITextLayer.definePropertiesFromExtensions({

    updateHTMLProperty_textColor: function(context){
        context.style.color = this.presentation.textColor ? this.presentation.textColor.cssString() : '';
    },

    updateHTMLProperty_font: function(context){
        context.style.font = this.presentation.font ? this.presentation.font.cssString() : '';
    },

});

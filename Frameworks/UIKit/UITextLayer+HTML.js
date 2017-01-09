// #import "UIKit/UITextLayer.js"
/* global JSClass, UITextLayer, JSClassFromName, UITextAlignment */
'use strict';

UITextLayer.definePropertiesFromExtensions({

    updateAllHTMLProperties: function(context){
        UITextLayer.$super.updateAllHTMLProperties.call(this, context);
        this.updateHTMLProperty_textColor(context);
        this.updateHTMLProperty_font(context);
        this.updateHTMLProperty_textAlignment(context);
    },

    updateHTMLProperty_textColor: function(context){
        context.style.color = this.presentation.textColor ? this.presentation.textColor.cssString() : '';
    },

    updateHTMLProperty_font: function(context){
        context.style.font = this.presentation.font ? this.presentation.font.cssString() : '';
    },

    updateHTMLProperty_textAlignment: function(context){
        var align = '';
        switch (this._textAlignment){
            case UITextAlignment.Left:
                align = 'left';
                break;
            case UITextAlignment.Center:
                align = 'center';
                break;
            case UITextAlignment.Right:
                align = 'right';
                break;
            case UITextAlignment.Justify:
                align = 'justify';
                break;
        }
        context.style.textAlign = align;
    },

});

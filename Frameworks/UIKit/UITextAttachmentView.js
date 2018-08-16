// #import "Foundation/Foundation.js"
// #import "UIKit/UIView.js"
/* global JSClass, JSTextAttachment, UIView, JSPoint, JSSize */
'use strict';

JSClass("UITextAttachmentView", JSTextAttachment, {

    view: null,

    initWithView: function(view){
        this.view = view;
    },

    getSize: function(){
        return this.view.frame.size;
    },

    layout: function(font, lineWidth){
        this.view.sizeToFitSize(JSSize(lineWidth, Number.MAX_VALUE));
    },

    drawInContextAtPoint: function(context, point){
        this.view.layer.renderInContext(context);
    }

});
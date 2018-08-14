// #import "Foundation/Foundation.js"
// #import "UIKit/UIView.js"
/* global JSClass, JSTextAttachment, UIView, JSPoint */
'use strict';

JSClass("UITextAttachmentView", JSTextAttachment, {

    view: null,

    initWithView: function(view){
        this.view = view;
    },

    getSize: function(){
        this.view.layoutIfNeeded();
        return this.view.frame.size;
    },

    layout: function(font, lineWidth){
    },

    drawInContextAtPoint: function(context, point){
        this.view.layer.renderInContext(context);
    }

});
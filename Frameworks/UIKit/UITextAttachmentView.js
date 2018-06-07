// #import "Foundation/Foundation.js"
// #import "UIKit/UIView.js"
/* global JSClass, JSTextAttachment, UIView, JSPoint */
'use strict';

JSClass("UITextAttachmentView", JSTextAttachment, {

    view: null,
    originOffset: null,
    typesetterSuperview: null,

    initWithView: function(view, typesetterSuperview){
        this.view = view;
        this.typesetterSuperview = typesetterSuperview;
        this.originOffset = JSPoint.Zero;
    },

    getSize: function(){
        this.view.layoutIfNeeded();
        return this.view.frame.size;
    },

    layout: function(font, lineWidth){
    },

    drawInContext: function(context){
        if (!this.view.superview){
            this.view.layer.renderInContext(context);
        }
    }

});
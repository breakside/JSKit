// #import "Foundation/Foundation.js"
// #import "UIKit/UIView.js"
/* global JSClass, JSTextAttachment, UIView */
'use strict';

JSClass("UITextAttachmentView", JSTextAttachment, {

    view: null,

    initWithView: function(view){
        this.view = view;
    },

    getSize: function(){
        return this.view.frame.size;
    },

    drawInContext: function(context){
        this.view.layer.renderInContext(context);
    }

});
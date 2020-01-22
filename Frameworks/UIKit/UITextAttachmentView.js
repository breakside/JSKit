// #import Foundation
// #import "UIView.js"
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
        this.baselineAdjustment = -this.view.lastBaselineOffsetFromBottom;
    },

    drawInContextAtPoint: function(context, point){
        this.view.layer.renderInContext(context);
    }

});
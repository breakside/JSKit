// #import "UIKit/UIScrollLayer.js"
/* global JSClass, UIScrollLayer */
'use strict';

UIScrollLayer.definePropertiesFromExtensions({

    renderInHTMLContext: function(context){
        UIScrollLayer.$super.renderInHTMLContext.call(this, context);
        var element = context.element;
        var sizer = element.appendChild(element.ownerDocument.createElement('div'));
        sizer.style.position = 'absolute';
        sizer.style.top = '0px';
        sizer.style.left = '0px';
        sizer.style.width = '0px';
        sizer.style.height = '0px';
        element.style.overflow = 'auto';
        context.scrollContentSizer = sizer;
    },

    displayHTMLProperty_contentSize: function(context){
        context.scrollContentSizer.style.width = this.presentation.contentSize.width + 'px';
        context.scrollContentSizer.style.height = this.presentation.contentSize.height + 'px';
    },

    displayHTMLProperty_contentOffset: function(context){
        context.element.scrollLeft = this.presentation.contentOffset.x;
        context.element.scrollTop = this.presentation.contentOffset.y;
    }

});
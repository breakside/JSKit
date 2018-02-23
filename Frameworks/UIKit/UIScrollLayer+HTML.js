// #import "UIKit/UIScrollLayer.js"
/* global JSClass, UIScrollLayer, JSPoint, JSRect */
'use strict';

UIScrollLayer.definePropertiesFromExtensions({

    _ignoreNextSrollEvent: false,

    boundsOriginDidChange: function(){
        // base class requests new positions for sublayers, but html scrolling already takes
        // care of that for us, so skip unecessary requests
    },

    initializeHTMLContext: function(context){
        UIScrollLayer.$super.initializeHTMLContext.call(this, context);
        var element = context.element;
        var sizer = element.appendChild(element.ownerDocument.createElement('div'));
        sizer.style.position = 'absolute';
        sizer.style.top = '0px';
        sizer.style.left = '0px';
        sizer.style.width = '0px';
        sizer.style.height = '0px';
        sizer.dataset.scrollHelper = "sizer";
        element.style.overflow = 'auto';
        context.scrollContentSizer = sizer;
        element.addEventListener('scroll', this);
    },

    destroyHTMLContext: function(context){
        var element = context.element;
        element.removeEventListener('scroll', this);
    },

    updateHTMLProperty_clipsToBounds: function(context){
        // scroll layer always clips to bounds, and parent class logic interferes
        // with overflow: auto that was set in initializeHTMLContext
    },

    updateHTMLProperty_contentSize: function(context){
        // Always update the offset first so the width/height updates don't trigger their own scroll event
        // in the case where the content offset must be reduced to fit within the new size constraints.
        // UIScrollLayer will have already done this calculation, and an offset update will be pending.
        this.updateHTMLProperty_contentOffset(context);
        context.scrollContentSizer.style.width = this.presentation.contentSize.width + 'px';
        context.scrollContentSizer.style.height = this.presentation.contentSize.height + 'px';
    },

    updateHTMLProperty_contentOffset: function(context){
        if (this.presentation.contentOffset.x != context.element.scrollLeft || this.presentation.contentOffset.y != context.element.scrollTop){
            this._ignoreNextSrollEvent = true;
            context.element.scrollLeft = this.presentation.contentOffset.x;
            context.element.scrollTop = this.presentation.contentOffset.y;
        }
    },

    handleEvent: function(e){
        if (e.type == 'scroll'){
            if (!this._ignoreNextSrollEvent){
                var element = e.currentTarget;
                this.model.contentOffset = JSPoint(element.scrollLeft, element.scrollTop);
                this.model.bounds = JSRect(this.model.contentOffset, this.model.bounds.size);
            }
            this._ignoreNextSrollEvent = false;
        }
    }

});
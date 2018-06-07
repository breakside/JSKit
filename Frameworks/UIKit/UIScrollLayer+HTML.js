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
        context.scrollOrigin = JSPoint.Zero;
        var element = context.element;
        element.style.overflow = 'scroll';
        element.style.webkitOverflowScrolling = 'touch';
        element.addEventListener('scroll', this);
        var sizer = element.appendChild(element.ownerDocument.createElement('div'));
        sizer.style.position = 'absolute';
        sizer.style.top = '0px';
        sizer.style.left = '0px';
        sizer.style.width = '0px';
        sizer.style.height = '0px';
        sizer.dataset.scrollHelper = "sizer";
        context.scrollContentSizer = sizer;
        context.layerManagedTopNodeCount = 0;
        // element.addEventListener('touchstart', this, true);
        // element.addEventListener('touchmove', this, true);
        // element.addEventListener('touchend', this, true);
        // element.addEventListener('touchcancel', this, true);
    },

    updateAllHTMLProperties: function(context){
        UIScrollLayer.$super.updateAllHTMLProperties.call(this, context);
        this.updateHTMLProperty_contentSize(context);
        this.updateHTMLProperty_contentOffset(context);
        this.updateHTMLProperty_contentInsets(context);
    },

    destroyHTMLContext: function(context){
        var element = context.element;
        element.removeEventListener('scroll', this);
        // element.removeEventListener('touchstart', this, true);
        // element.removeEventListener('touchmove', this, true);
        // element.removeEventListener('touchend', this, true);
        // element.removeEventListener('touchcancel', this, true);
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
        this._updateSizer(context);
    },

    updateHTMLProperty_contentOffset: function(context){
        if (this.presentation.contentOffset.x != context.element.scrollLeft || this.presentation.contentOffset.y != context.element.scrollTop){
            this._ignoreNextSrollEvent = true;
            context.element.scrollLeft = this.presentation.contentOffset.x;
            context.element.scrollTop = this.presentation.contentOffset.y;
        }
    },

    updateHTMLProperty_contentInsets: function(context){
        context.scrollOrigin.x = -this.presentation.contentInsets.left;
        context.scrollOrigin.y = -this.presentation.contentInsets.top;
        this._updateSizer(context);
    },

    _updateSizer: function(context){   
        context.scrollContentSizer.style.width = (this.presentation.contentSize.width + this.presentation.contentInsets.left + this.presentation.contentInsets.right) + 'px';
        context.scrollContentSizer.style.height = (this.presentation.contentSize.height + this.presentation.contentInsets.top + this.presentation.contentInsets.bottom) + 'px';
    },

    handleEvent: function(e){
        this['_event_' + e.type](e);
    },

    _event_scroll: function(e){
        if (!this._ignoreNextSrollEvent){
            var element = e.currentTarget;
            this.model.contentOffset = JSPoint(element.scrollLeft, element.scrollTop);
            this._updateBoundsForContentOffset();
            this._didScroll();
            // this._displayServer.updateDisplay(e.timeStamp / 1000.0);
        }
        this._ignoreNextSrollEvent = false;
    },

    _event_touchstart: function(e){
        e.stopPropagation();
    },

    _event_touchmove: function(e){
        e.stopPropagation();
    },

    _event_touchend: function(e){
        e.stopPropagation();
    },

    _event_touchcancel: function(e){
        e.stopPropagation();
    }

});
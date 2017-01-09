// #import "UIKit/UILayer.js"
// #import "UIKit/UIDisplayServer.js"
/* global UILayer, JSConstraintBox, JSPoint, UIDisplayServer */
'use strict';

UILayer.definePropertiesFromExtensions({

    initializeHTMLContext: function(context){
        context.style.position = 'absolute';
        context.style.boxSizing = 'border-box';
        context.style.mozBoxSizing = 'border-box';
    },

    destroyHTMLContext: function(context){
    },

    createBorderElementIfNeeded: function(context){
        var needsBorderElement = context.borderElement === null && this.presentation.borderWidth > 0;
        if (needsBorderElement){
            context.borderElement = context.element.ownerDocument.createElement('div');
            context.element.appendChild(context.borderElement);
            context.borderElement.style.position = 'absolute';
            context.borderElement.style.top = '0';
            context.borderElement.style.left = '0';
            context.borderElement.style.bottom = '0';
            context.borderElement.style.right = '0';
        }
    },

    updateAllHTMLProperties: function(context){
        this.updateHTMLProperty_bounds(context);
        this.updateHTMLProperty_transform(context);
        this.updateHTMLProperty_hidden(context);
        this.updateHTMLProperty_alpha(context);
        this.updateHTMLProperty_backgroundColor(context);
        this.updateHTMLProperty_borderWidth(context);
        this.updateHTMLProperty_borderColor(context);
        this.updateHTMLProperty_cornerRadius(context);
        this.updateHTMLProperty_shadow(context);
    },

    updateHTMLProperty_bounds: function(context){
        context.style.width = this.presentation.bounds.size.width + 'px';
        context.style.height = this.presentation.bounds.size.height + 'px';
    },

    updateHTMLProperty_transform: function(context){
        var transform = this.presentation.transform;
        var anchorPoint = this.presentation.anchorPoint;
        if (!transform.isIdentity){
            var cssTransform = 'matrix(%f, %f, %f, %f, %f, %f)'.sprintf(transform.a, transform.b, transform.c, transform.d, transform.tx, transform.ty);
            context.style.transform = cssTransform;
            context.style.transformOrigin = '%f%% %f%% 0'.sprintf(anchorPoint.x * 100, anchorPoint.y * 100);
        }else{
            context.style.transform = '';
            context.style.transformOrigin = '';
        }
    },

    updateHTMLProperty_hidden: function(context){
        context.style.display = this.presentation.hidden ? 'none' : '';
    },

    updateHTMLProperty_alpha: function(context){
        context.style.opacity = this.presentation.alpha != 1.0 ? this.presentation.alpha : '';
    },

    updateHTMLProperty_backgroundColor: function(context){
        context.style.backgroundColor = this.presentation.backgroundColor ? this.presentation.backgroundColor.cssString() : '';
    },

    updateHTMLProperty_borderWidth: function(context){
        if (this.presentation.borderWidth){
            context.borderElement.style.borderWidth = this.presentation.borderWidth + 'px';
            context.borderElement.style.borderStyle = 'solid';
        }else{
            if (context.borderElement !== null){
                context.borderElement.parentNode.removeChild(context.borderElement);
                context.borderElement = null;
            }
        }
    },

    updateHTMLProperty_borderColor: function(context){
        if (context.borderElement !== null){
            context.borderElement.style.borderColor = this.presentation.borderColor ? this.presentation.borderColor.cssString() : '';
        }
    },

    updateHTMLProperty_cornerRadius: function(context){
        context.style.borderRadius = this.presentation.cornerRadius ? this.presentation.cornerRadius + 'px' : '';
        if (context.borderElement !== null){
            context.borderElement.style.borderRadius = this.presentation.cornerRadius ? this.presentation.cornerRadius + 'px' : '';
        }
    },

    updateHTMLProperty_shadow: function(context){
        if (this.presentation.shadowColor){
            context.style.boxShadow = '%fpx %fpx %fpx %s'.sprintf(this.shadowOffset.x, this.shadowOffset.y, this.shadowRadius, this.shadowColor.cssString());
        }else{
            context.style.boxShadow = '';
        }
    }
});
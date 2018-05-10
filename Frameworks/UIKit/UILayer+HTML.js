// #import "UIKit/UILayer.js"
// #import "UIKit/UIView.js"
// #import "UIKit/UIDisplayServer.js"
/* global UILayer, JSConstraintBox, JSPoint, UIDisplayServer, UIView */
'use strict';

UILayer.definePropertiesFromExtensions({

    initializeHTMLContext: function(context){
        context.style.position = 'absolute';
        context.style.boxSizing = 'border-box';
        context.style.mozBoxSizing = 'border-box';
        if (this.delegate && this.delegate.initializeLayerHTMLContext){
            this.delegate.initializeLayerHTMLContext(this, context);
        }
    },

    destroyHTMLContext: function(context){
        if (this.delegate && this.delegate.destroyLayerHTMLContext){
            this.delegate.destroyLayerHTMLContext(this, context);
        }
    },

    updateAllHTMLProperties: function(context){
        this.updateHTMLProperty_bounds(context);
        this.updateHTMLProperty_transform(context);
        this.updateHTMLProperty_hidden(context);
        this.updateHTMLProperty_clipsToBounds(context);
        this.updateHTMLProperty_alpha(context);
        this.updateHTMLProperty_backgroundColor(context);
        this.updateHTMLProperty_backgroundGradient(context);
        this.updateHTMLProperty_borderWidth(context);
        this.updateHTMLProperty_borderColor(context);
        this.updateHTMLProperty_cornerRadius(context);
        this.updateHTMLProperty_shadow(context);
    },

    updateHTMLProperty_bounds: function(context){
        context.updateSize(this.presentation.bounds.size);
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
        context.style.visibility = this.presentation.hidden ? 'hidden' : '';
    },

    updateHTMLProperty_clipsToBounds: function(context){
        context.style.overflow = this._clipsToBounds ? 'hidden' : '';
    },

    updateHTMLProperty_alpha: function(context){
        context.style.opacity = this.presentation.alpha != 1.0 ? this.presentation.alpha : '';
    },

    updateHTMLProperty_backgroundColor: function(context){
        context.style.backgroundColor = this.presentation.backgroundColor ? this.presentation.backgroundColor.cssString() : '';
    },

    updateHTMLProperty_backgroundGradient: function(context){
        context.style.backgroundImage = this.presentation.backgroundGradient ? this.presentation.backgroundGradient.cssString() : '';
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
        var css = '';
        if (this.presentation.cornerRadii){
            css = '%fpx %fpx %fpx %fpx'.sprintf(this.presentation.cornerRadii.topLeft, this.presentation.cornerRadii.topRight, this.presentation.cornerRadii.bottomRight, this.presentation.cornerRadii.bottomLeft);
        }else if (this.presentation.cornerRadius){
            css = '%fpx'.sprintf(this.presentation.cornerRadius);
        }
        context.style.borderRadius = css;
        if (context.borderElement !== null){
            context.borderElement.style.borderRadius = css;
        }
    },

    updateHTMLProperty_shadow: function(context){
        if (this.presentation.shadowColor){
            context.style.boxShadow = '%fpx %fpx %fpx %s'.sprintf(this.shadowOffset.x, this.shadowOffset.y, this.shadowRadius, this.presentation.shadowColor.cssString());
        }else{
            context.style.boxShadow = '';
        }
    }

});
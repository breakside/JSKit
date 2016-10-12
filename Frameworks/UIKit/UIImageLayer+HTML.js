// #import "UIKit/UIImageLayer.js"
/* global JSClass, UIImageLayer */
'use strict';

UIImageLayer.definePropertiesFromExtensions({

    setConstantHTMProperties: function(context){
        UIImageLayer.$super.setConstantHTMProperties.call(this, context);
        var element = context.element;
        var img = element.appendChild(element.ownerDocument.createElement('img'));
        img.style.position = 'absolute';
        img.style.top = '0';
        img.style.left = '0';
        img.style.right = '0';
        img.style.bottom = '0';
        context.imageElement = img;
    },

    updateHTMLProperty_image: function(context){
        // TODO: should this use an img tag or use background-image?
        context.imageElement.src = this.image.htmlURLString();
    }

});
// #import "UIKit/UIImageLayer.js"
/* global JSClass, UIImageLayer */
'use strict';

UIImageLayer.definePropertiesFromExtensions({

    initializeHTMLContext: function(context){
        UIImageLayer.$super.initializeHTMLContext.call(this, context);
        context.style.borderColor = 'transparent';
        context.style.borderStyle = 'solid';
    },

    updateHTMLProperty_image: function(context){
        if (this.image !== null){
            var cssURL = "url('" + this.image.htmlURLString() + "')";
            var box = this.image.stretchBox;
            if (box === null){
                context.style.backgroundImage = cssURL;
                context.style.backgroundSize = '100% 100%';
                context.style.borderWidth = '';
                context.style.borderImage = '';
            }else{
                context.style.backgroundImage = '';
                context.style.borderWidth = '%dpx %dpx %dpx %dpx'.sprintf(box.top / this.image.scale, box.right / this.image.scale, box.bottom / this.image.scale, box.left / this.image.scale);
                context.style.borderImage = cssURL + " %d %d %d %d fill stretch".sprintf(box.top, box.right, box.bottom, box.left);
            }
        }else{
            context.style.backgroundImage = '';
            context.style.border = '';
            context.style.borderImage = '';
        }
    }

});
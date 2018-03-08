// #import "Foundation/Foundation.js"
// #import "UIKit/UIHTMLTextLine.js"
/* global JSClass, JSTextFrame, UIHTMLTextFrame, UIHTMLTextLine, JSAttributedString, JSRange, JSFont, JSPoint, JSRect, JSSize */
'use strict';

(function(){

JSClass("UIHTMLTextFrame", JSTextFrame, {

    element: null,

    initWithReusableElement: function(element, lines, size){
        UIHTMLTextFrame.$super.initWithLines.call(this, lines, size);
        this.element = element;
        var line;
        for (var i = 0, l = lines.length; i < l; ++i){
            line = this.lines[i];
            if (line.element.parentNode !== this.element){
                line.element.style.position = 'relative';
                line.element.style.visibility = '';
                this.element.appendChild(line.element);
            }
        }
    },

    initWithDocument: function(domDocument, lines, size){
        this.initWithReusableElement(domDocument.createElement('div'), lines, size);
        this.element.style.position = 'absolute';
        this.element.dataset.uiText = "frame";

        // this.shade = this.element.appendChild(domDocument.createElement('div'));
        // this.shade.style.position = 'absolute';
        // this.shade.style.top = '0';
        // this.shade.style.left = '0';
        // this.shade.style.bottom = '0';
        // this.shade.style.right = '0';
        // this.shade.style.backgroundColor = 'rgba(255,0,0,0.3)';
    },

    drawInContextAtPoint: function(context, point){
        this.element.style.width = '%dpx'.sprintf(this.size.width);
        this.element.style.height = '%dpx'.sprintf(this.size.height);
        this.element.style.left = '%dpx'.sprintf(point.x);
        this.element.style.top = '%dpx'.sprintf(point.y);
        context.addExternalElement(this.element);
    }

});

})();
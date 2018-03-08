// #import "Foundation/Foundation.js"
// #import "UIKit/UIHTMLTextRun.js"
/* global JSClass, JSTextLine, UIHTMLTextLine, JSSize, UIHTMLTextRun, JSAttributedString, JSFont, JSRect */
'use strict';

(function(){

JSClass("UIHTMLTextLine", JSTextLine, {

    element: null,

    initWithReusableElement: function(element, runs, origin, width, textAlignment){
        // constructing this.element before super init because super init calls
        // this.align, which neesd to use this.element
        this.element = element;
        this.element.style.visibility = '';
        UIHTMLTextLine.$super.initWithRuns.call(this, runs, origin, width, textAlignment);
        var run;
        for (var i = 0, l = runs.length; i < l; ++i){
            run = this.runs[i];
            if (run.element.parentNode !== this.element){
                this.element.appendChild(run.element);
                run.element.style.visibility = '';
                run.element.style.position = 'relative';
            }
        }
        this._size = JSSize(this.size.width, this.element.offsetHeight);
    },

    initWithDocument: function(domDocument, runs, origin, width, textAlignment){
        this.initWithReusableElement(domDocument.body.appendChild(domDocument.createElement('div')), runs, origin, width, textAlignment);
        this.element.dataset.uiText = "line";
        this.element.style.whiteSpace = 'pre';
        this.element.style.lineHeight = '0';
        this.element.style.visibility = 'hidden';
        this.element.style.position = 'absolute';

        // this.shade = this.element.appendChild(domDocument.createElement('div'));
        // this.shade.style.position = 'absolute';
        // this.shade.style.top = '0';
        // this.shade.style.left = '0';
        // this.shade.style.bottom = '0';
        // this.shade.style.right = '0';
        // this.shade.style.backgroundColor = 'rgba(0,255,0,0.3)';
    },

    align: function(textAlignment){
        this.element.style.textAlign = textAlignment;
        var run;
        for (var i = 0, l = this._runs.length; i < l; ++i){
            run = this.runs[i];
            run.updateOrigin();
        }
    }

});

})();
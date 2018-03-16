// #import "Foundation/Foundation.js"
// #import "UIKit/UIHTMLTextFrame.js"
// #import "UIKit/UIHTMLTextTypesetter.js"
/* global JSClass, JSReadOnlyProperty, JSTextFramesetter, UIHTMLTextFramesetter, UIHTMLTextTypesetter, UIHTMLTextFrame */
'use strict';

(function(){

JSClass("UIHTMLTextFramesetter", JSTextFramesetter, {

    _domDocument: null,
    _htmlTypesetter: null,
    _reusableFrameElement: null,

    initWithDocument: function(domDocument){
        this._htmlTypesetter = UIHTMLTextTypesetter.initWithDocument(domDocument);
        UIHTMLTextFramesetter.$super.initWithTypesetter.call(this, this._htmlTypesetter);
        this._domDocument = domDocument;
    },

    createFrame: function(size, range, maximumLines, lineBreakMode, textAlignment){
        this._resetReusableFrameElement();
        this._htmlTypesetter.layoutRange(range, size, lineBreakMode);
        return UIHTMLTextFramesetter.$super.createFrame.call(this, size, range, maximumLines, lineBreakMode, textAlignment);
    },

    constructFrame: function(lines, size, textAlignment){
        return UIHTMLTextFrame.initWithElement(this._reusableFrameElement, lines, size, textAlignment);
    },

    _resetReusableFrameElement: function(){
        if (this._reusableFrameElement === null){
            this._reusableFrameElement = this._domDocument.createElement('div');
            this._reusableFrameElement.style.position = 'absolute';
            this._reusableFrameElement.style.visibility = 'hidden';
            this._reusableFrameElement.style.overflow = 'hidden';
            this._domDocument.body.appendChild(this._reusableFrameElement);
        }else{
            var nodes = this._reusableFrameElement.childNodes;
            for (var i = nodes.length - 1; i >= 0; --i){
                this._reusableFrameElement.removeChild(nodes[i]);
            }
        }
    }

});

})();
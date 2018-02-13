// #import "Foundation/Foundation.js"
// #import "UIKit/UIHTMLTextFrame.js"
// #import "UIKit/UIHTMLTextTypesetter.js"
/* global JSClass, JSReadOnlyProperty, JSTextFramesetter, UIHTMLTextFramesetter, UIHTMLTextTypesetter, UIHTMLTextFrame */
'use strict';

(function(){

JSClass("UIHTMLTextFramesetter", JSTextFramesetter, {

    domDocument: JSReadOnlyProperty('_domDocument'),
    _htmlTypesetter: null,
    _reusableFrame: null,

    initWithDocument: function(domDocument){
        this._htmlTypesetter = UIHTMLTextTypesetter.initWithDocument(domDocument);
        UIHTMLTextFramesetter.$super.initWithTypesetter.call(this, this._htmlTypesetter);
        this._domDocument = domDocument;
    },

    constructFrame: function(lines, size){
        if (this._reusableFrame !== null){
            return UIHTMLTextFrame.initWithReusableElement(this._reusableFrame.element, lines, size);
        }
        return UIHTMLTextFrame.initWithDocument(this.domDocument, lines, size);
    },

    createFrame: function(size, attributedString, range, maximumLines, lineBreakMode, textAlignment){
        if (this._reusableFrame !== null){
            this._htmlTypesetter.enqueueReusableLines(this._reusableFrame.lines);
        }
        this._reusableFrame = UIHTMLTextFramesetter.$super.createFrame.call(this, size, attributedString, range, maximumLines, lineBreakMode, textAlignment);
        this._htmlTypesetter.cleanupUnusedElements();
        return this._reusableFrame;
    }

});

})();
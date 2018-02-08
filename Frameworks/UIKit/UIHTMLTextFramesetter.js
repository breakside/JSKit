// #import "Foundation/Foundation.js"
// #import "UIKit/UIHTMLTextFrame.js"
/* global JSClass, JSReadOnlyProperty, JSTextFramesetter, UIHTMLTextFramesetter, UIHTMLTextTypesetter, UIHTMLTextFrame */
'use strict';

(function(){

JSClass("UIHTMLTextFramesetter", JSTextFramesetter, {

    domDocument: JSReadOnlyProperty('_domDocument'),
    _htmlTypesetter: null,
    _reusableFrame: null,

    initWithDocument: function(domDocument){
        this._htmlTypesetter = UIHTMLTextTypesetter.initWithDocument(domDocument);
        UIHTMLTextFramesetter.$super.initWithTypesetter(this._htmlTypesetter);
        this._domDocument = domDocument;
    },

    constructFrame: function(size){
        if (this._reusableFrame === null){
            this._reusableFrame = UIHTMLTextFrame.initWithDocument(this.domDocument, size);
        }else{
            this._htmlTypesetter.enqueueReusableLines(this._reusableFrame.lines);
            this._reusableFrame.reinitWithSize(size);
        }
        return this._reusableFrame;
    },

    createFrame: function(size, attributedString, range, maximumLines, lineBreakMode, textAlignment){
        UIHTMLTextFramesetter.$super.createFrame.call(this, size, attributedString, range, maximumLines, lineBreakMode, textAlignment);
        this._htmlTypesetter.cleanupUnusedElements();
        return this._reusableFrame;
    }

});

})();
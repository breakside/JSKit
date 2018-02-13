// #import "Foundation/Foundation.js"
// #import "UIKit/UIHTMLTextGlyphStorage.js"
// #import "UIKit/UIHTMLTextLine.js"
// #import "UIKit/UIHTMLTextRun.js"
/* global JSClass, JSReadOnlyProperty, JSTextTypesetter, JSTextGlyphStorage, UIHTMLTextGlyphStorage, UIHTMLTextTypesetter, UIHTMLTextLine, UIHTMLTextRun */
'use strict';

(function(){

JSClass("UIHTMLTextTypesetter", JSTextTypesetter, {

    domDocument: JSReadOnlyProperty('_domDocument'),
    _reusableLines: null,
    _reusableGlyphStorageElements: null,

    initWithDocument: function(domDocument){
        UIHTMLTextTypesetter.$super.init.call(this);
        this._domDocument = domDocument;
        this._reusableLines = [];
        this._reusableGlyphStorageElements = [];
    },

    enqueueReusableLines: function(lines){
        for (var i = lines.length - 1; i >= 0; --i){
            this.enqueueResuableLine(lines[i]);
        }
    },

    enqueueResuableLine: function(line){
        this._reusableLines.push(line);
        this.enqueueReusableRuns(line.runs);
    },

    dequeueResuableLine: function(runs, origin, width, textAlignment){
        var line;
        if (this._reusableLines.length > 0){
            line = this._reusableLines.pop();
            line = UIHTMLTextLine.initWithReusableElement(line.element, runs, origin, width, textAlignment);
        }else{
            line = UIHTMLTextLine.initWithDocument(this.domDocument, runs, origin, width, textAlignment);
        }
        return line;
    },

    enqueueReusableRuns: function(runs){
        for (var i = runs.length - 1; i >= 0; --i){
            this.enqueueReusableRun(runs[i]);
        }
    },

    enqueueReusableRun: function(run){
        this._reusableGlyphStorageElements.push(run.element);
        // run.element.style.display = 'none';
    },

    dequeueResuableGlyphStorage: function(font, location){
        var element, glyphStorage;
        if (this._reusableGlyphStorageElements.length > 0){
            element = this._reusableGlyphStorageElements.pop();
            // run.element.style.display = '';
            glyphStorage = UIHTMLTextGlyphStorage.initWithReusableElement(element, font, location);
        }else{
            glyphStorage = UIHTMLTextGlyphStorage.initWithDocument(this.domDocument, font, location);
        }
        return glyphStorage;
    },

    cleanupUnusedElements: function(){
        var i, l;
        for (i = 0, l = this._reusableGlyphStorageElements.length; i < l; ++i){
            this.cleanupUnusedElement(this._reusableGlyphStorageElements[i]);
        }
        for (i = 0, l = this._reusableLines.length; i < l; ++i){
            this.cleanupUnusedElement(this._reusableLines[i].element);
        }
        this._reusableLines = [];
        this._reusableGlyphStorageElements = [];
    },

    cleanupUnusedElement: function(element){
        if (element.parentNode !== null){
            element.parentNode.removeChild(element);
        }
    },

    constructLine: function(runs, origin, width, textAlignment){
        return this.dequeueResuableLine(runs, origin, width, textAlignment);
    },

    constructRun: function(glyphStorage, attributes){
        return UIHTMLTextRun.initWithGlyphStorage(glyphStorage, attributes);
    },

    constructAttachmentRun: function(attachment, size){
        return UIHTMLTextRun.initWithAttachment(attachment, size);
    },

    constructGlyphStorage: function(font, location){
        return this.dequeueResuableGlyphStorage(font, location);
    }

});

})();
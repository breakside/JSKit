// #import "Foundation/Foundation.js"
// #import "UIKit/UIHTMLTextFrame.js"
/* global JSClass, JSReadOnlyProperty, JSTextTypesetter, JSTextGlyphStorage, UIHTMLTextGlyphStorage, UIHTMLTextTypesetter, UIHTMLTextLine, UIHTMLTextRun */
'use strict';

(function(){

JSClass("UIHTMLTextGlyphStorage", JSTextGlyphStorage, {

    element: null,
    textNode: null,
    width: JSReadOnlyProperty(),
    _lastPushLength: 0,

    initWithReusableElement: function(element, font, location){
        UIHTMLTextGlyphStorage.$super.initWithFont.call(this, font, location);
        this.element = element;
        if (this.element.firstChild === null){
            this.textNode = this.element.appendChild(element.ownerDocument.createTextNode(''));
        }else{
            this.textNode = this.element.firstChild;
            this.textNode.nodeValue = '';
        }
        this.element.style.font = font.cssString(font.htmlLineHeight + 4);
    },

    initWithDocument: function(domDocument, font, location){
        this.initWithReusableElement(domDocument.createElement('span'), font, location);
        domDocument.body.appendChild(this.element);
        this.element.style.visibility = 'hidden';
        this.element.style.position = 'absolute';
        this.element.style.verticalAlign = 'baseline';
        this.element.style.display = 'inline';
        this.element.dataset.uiText = "run";

        // this.shade = this.element.appendChild(domDocument.createElement('div'));
        // this.shade.style.position = 'absolute';
        // this.shade.style.top = '0';
        // this.shade.style.left = '0';
        // this.shade.style.bottom = '0';
        // this.shade.style.right = '0';
        // this.shade.style.backgroundColor = 'rgba(0,0,255,0.3)';
    },

    push: function(utf16){
        this.textNode.nodeValue += utf16;
        this.range.length += utf16.length;
        this._lastPushLength = utf16.length;
    },

    pop: function(){
        // only supports one pop, which for now is all we need
        this.textNode.nodeValue = this.textNode.nodeValue.substr(0, this.textNode.nodeValue.length - this._lastPushLength);
        this.range.length -= this._lastPushLength;
        this._lastPushLength = 0;
    },

    getWidth: function(){
        return this.element.offsetWidth;
    }

});

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
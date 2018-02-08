// #import "Foundation/Foundation.js"
// #import "UIKit/UIHTMLTextFrame.js"
/* global JSClass, JSReadOnlyProperty, JSTextTypesetter, UIHTMLTextTypesetter, UIHTMLTextLine, UIHTMLTextRun */
'use strict';

(function(){

JSClass("UIHTMLTextTypesetter", JSTextTypesetter, {

    domDocument: JSReadOnlyProperty('_domDocument'),
    _reusableLines: null,
    _reusableRuns: null,

    initWithDocument: function(domDocument){
        UIHTMLTextTypesetter.$super.init();
        this._domDocument = domDocument;
        this._reusableLines = [];
        this._reusableRuns = [];
    },

    enqueueReusableLines: function(lines){
        for (var i = lines.length - 1; i >= 0; --i){
            this.enqueueResuableLine(lines[i]);
        }
    },

    enqueueResuableLine: function(line){
        this._reusableLines.push(line);
    },

    dequeueResuableLine: function(attributes){
        var line;
        if (this._reusableLines.length > 0){
            line = this._reusableLines.pop();
            this.enqueueReusableRuns(line.runs);
            line.reinit(attributes);
            return line;
        }
        return UIHTMLTextLine.initWithDocument(this.domDocument, attributes);
    },

    enqueueReusableRuns: function(runs){
        for (var i = runs.length - 1; i >= 0; --i){
            this.enqueueResuableRun(runs[i]);
        }
    },

    enqueueResuableRun: function(run){
        this._reusableRuns.push(run);
        run.element.style.display = 'none';
    },

    dequeueResuableRun: function(attributes){
        var run;
        if (this._reusableRuns.length > 0){
            run = this._reusableRuns.pop();
            run.styleUsingAttributes(attributes);
            run.textNode.nodeValue = '';
            run.element.style.display = '';
            return run;
        }
        return UIHTMLTextRun.initWithDocument(this.domDocument, attributes);
    },

    cleanupUnusedElements: function(){
        var i, l;
        for (i = 0, l = this._reusableRuns.length; i < l; ++i){
            this.cleanupUnusedRun(this._reusableRuns[i]);
        }
        for (i = 0, l = this._reusableLines.length; i < l; ++i){
            this.cleanupUnusedLine(this._reusableLines[i]);
        }
        this._reusableLines = [];
        this._reusableRuns = [];
    },

    cleanupUnusedRun: function(run){
        if (run.element.parentNode !== null){
            run.element.parentNode.removeChild(run.element);
        }
    },

    cleanupUnusedLine: function(line){
        if (line.element.parentNode !== null){
            line.element.parentNode.removeChild(line.element);
        }
    },

    constructLine: function(attributes){
        return this.dequeueResuableLine(attributes);
    },

    constructRun: function(attributes){
        return this.dequeueResuableRun(attributes);
    }

});

})();
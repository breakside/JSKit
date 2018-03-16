// #import "Foundation/JSObject.js"
// #import "Foundation/CoreTypes.js"
// #import "Foundation/JSTextTypesetter.js"
// #import "Foundation/JSTextFrame.js"
/* global JSClass, JSObject, JSReadOnlyProperty, JSDynamicProperty, JSTextTypesetter, JSTextFrame, JSPoint, JSLineBreakMode, JSRange, JSTextAlignment */
'use strict';

(function(){

JSClass("JSTextFramesetter", JSObject, {

    typesetter: JSReadOnlyProperty('_typesetter', null),
    attributedString: JSDynamicProperty(),

    init: function(){
        this.initWithTypesetter(JSTextTypesetter.init());
    },

    initWithTypesetter: function(typesetter){
        this._typesetter = typesetter;
    },

    getAttributedString: function(){
        return this._typesetter.attributedString;
    },

    setAttributedString: function(attributedString){
        this._typesetter.attributedString = attributedString;
    },

    constructFrame: function(lines, size, textAlignment){
        return JSTextFrame.initWithLines(lines, size, textAlignment);
    },

    createFrame: function(size, range, maximumLines, lineBreakMode, textAlignment){
        var remianingRange = JSRange(range);
        var y = 0;
        var lines = [];
        var line;
        var lineRange;
        do{
            lineRange = this._typesetter.suggestLineBreak(size.width, remianingRange, this.effectiveLineBreakMode(lineBreakMode, lines.length + 1, maximumLines));
            line = this._typesetter.createLine(lineRange);
            y += line.size.height;
            // TODO: any line spacing?
            if (size.height === 0 || y <= size.height){
                lines.push(line);
                remianingRange.advance(line.range.length);
            }
        } while (lineRange.length > 0 && remianingRange.length > 0 && (size.height === 0 || y < size.height) && (maximumLines === 0 || lines.length < maximumLines));

        if (lineBreakMode == JSLineBreakMode.truncateTail){
            line = lines.pop();
            if (remianingRange.length > 0 && maximumLines === 0 || maximumLines > lines.length){
                // we got truncated because of height.  Re-run the last line so it
                // gets broken according to truncation rules rather than work break
                lineRange = this._typesetter.suggestLineBreak(size.width, JSRange(line.range.location, line.range.length + remianingRange.length), lineBreakMode);
                line = this._typesetter.createLine(lineRange);
            }
            var width = size.width;
            if (width === 0){
                width = Number.MAX_VALUE;
            }
            var truncated = line.truncatedLine(width);
            lines.push(truncated);
        }
        return this.constructFrame(lines, size, textAlignment);
    },

    effectiveLineBreakMode: function(frameLineBreakMode, lineNumber, maximumLines){
        switch (frameLineBreakMode){
            case JSLineBreakMode.truncateTail:
                if (maximumLines > 0 && lineNumber == maximumLines){
                    return frameLineBreakMode;
                }
                return JSLineBreakMode.wordWrap;
            case JSLineBreakMode.wordWrap:
                return frameLineBreakMode;
            case JSLineBreakMode.characterWrap:
                return frameLineBreakMode;
        }
    }

});

})();
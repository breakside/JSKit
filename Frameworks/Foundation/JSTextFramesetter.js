// #import "Foundation/JSObject.js"
// #import "Foundation/CoreTypes.js"
// #import "Foundation/JSTextTypesetter.js"
// #import "Foundation/JSTextFrame.js"
/* global JSClass, JSObject, JSReadOnlyProperty, JSDynamicProperty, JSTextTypesetter, JSTextFrame, JSPoint, JSLineBreakMode, JSRange */
'use strict';

(function(){

JSClass("JSTextFramesetter", JSObject, {

    typesetter: JSReadOnlyProperty('_typesetter'),
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

    constructFrame: function(lines, size){
        return JSTextFrame.initWithLines(lines, size);
    },

    createFrame: function(size, range, maximumLines, lineBreakMode, textAlignment){
        var remianingRange = JSRange(range);
        var origin = JSPoint.Zero;
        var lines = [];
        var line;
        do{
            line = this._typesetter.createLine(origin, size.width, remianingRange, this.effectiveLineBreakMode(lineBreakMode, lines.length + 1, maximumLines), textAlignment);
            origin.y += line.size.height;
            // TODO: any line spacing?
            if (size.height === 0 || origin.y <= size.height){
                lines.push(line);
                remianingRange.advance(line.range.length);
            }
        } while (line.range.length > 0 && remianingRange.length > 0 && (size.height === 0 || origin.y < size.height) && (maximumLines === 0 || lines.length < maximumLines));

        // If we don't have a maximum number of lines, but we were limited by size,
        // and we want to tail truncate, then redo the final line with tail truncation on,
        // since we didn't specify it ahead of time, not knowing if this was the final line or not.
        if (maximumLines === 0 && remianingRange.length > 0 && lineBreakMode == JSLineBreakMode.truncateTail){
            line = lines.pop();
            origin = JSPoint(line.origin);
            line = this._typesetter.createLine(origin, size.width, JSRange(line.range.location, remianingRange.end - line.range.location), lineBreakMode, textAlignment);
            lines.push(line);
        }
        return this.constructFrame(lines, size);
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
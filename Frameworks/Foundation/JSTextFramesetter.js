// #import "Foundation/JSObject.js"
/* global JSClass, JSObject, JSReadOnlyProperty, JSTextTypesetter, JSTextFrame, JSPoint, JSLineBreakMode, JSRange */
'use strict';

(function(){

JSClass("JSTextFramesetter", JSObject, {

    typesetter: JSReadOnlyProperty('_typesetter'),

    init: function(){
        this.initWithTypesetter(JSTextTypesetter.init());
    },

    initWithTypesetter: function(typesetter){
        this._typesetter = typesetter;
    },

    constructFrame: function(size){
        return JSTextFrame.initWithSize(size);
    },

    createFrame: function(size, attributedString, range, maximumLines, lineBreakMode, textAlignment){
        range = JSRange(range);
        var frame = this.constructFrame(size);
        frame.range.location = range.location;
        var origin = JSPoint.Zero;
        var line;
        do{
            line = this._typesetter.createLine(size.width, attributedString, range, this.effectiveLineBreakMode(lineBreakMode, frame.lines.length + 1, maximumLines), textAlignment);
            line.origin.x = origin.x;
            line.origin.y = origin.y;
            origin.y += line.size.height;
            // TODO: any line spacing?
            if (origin.y <= size.height){
                frame.addLine(line);
                range.advance(line.range.length);
            }
        } while (line.range.length > 0 && range.length > 0 && (size.height === 0 || origin.y < size.height) && (maximumLines === 0 || frame.lines.length == maximumLines));
        frame.range.length = range.location - frame.range.location;
        return frame;
    },

    effectiveLineBreakMode: function(frameLineBreakMode, lineNumber, maximumLines){
        switch (frameLineBreakMode){
            case JSLineBreakMode.TruncateTail:
                if (maximumLines > 0 && lineNumber == maximumLines){
                    return frameLineBreakMode;
                }
                return JSLineBreakMode.WordWrap;
            case JSLineBreakMode.WordWrap:
                return frameLineBreakMode;
            case JSLineBreakMode.CharacterWrap:
                return frameLineBreakMode;
        }
    }

});

})();
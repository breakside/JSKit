// #import "Foundation/JSObject.js"
// #import "Foundation/CoreTypes.js"
// #import "Foundation/JSTextTypesetter.js"
// #import "Foundation/JSTextFrame.js"
// #import "Foundation/JSAttributedString.js"
/* global JSClass, JSObject, JSSize, JSReadOnlyProperty, JSDynamicProperty, JSTextTypesetter, JSTextFrame, JSPoint, JSLineBreakMode, JSRange, JSTextAlignment, JSAttributedString */
'use strict';

(function(){

JSClass("JSTextFramesetter", JSObject, {

    typesetter: JSReadOnlyProperty('_typesetter', null),
    attributedString: JSDynamicProperty(),
    attributes: null,

    init: function(){
        this.initWithTypesetter(JSTextTypesetter.init());
        this.attributes = Object.create(JSTextParagraphAttributes);
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

    constructFrame: function(lines, size, attributes){
        return JSTextFrame.initWithLines(lines, size, attributes);
    },

    createFrame: function(size, range, maximumLines){
        var remianingRange = JSRange(range);
        var y = 0;
        var lines = [];
        var line;
        var lineRange;
        if (size.width < 0 || size.height < 0){
            size = JSSize(size.width < 0 ? 0 : size.width, size.height < 0 ? 0 : size.height);
        }
        var widthLimit = size.width || Number.MAX_VALUE;
        var heightLimit = size.height || Number.MAX_VALUE;
        var lineLimit = maximumLines || Number.MAX_VALUE;
        var spacing;
        do{
            lineRange = this._typesetter.suggestLineBreak(widthLimit, remianingRange, this.effectiveLineBreakMode(this.attributes.lineBreakMode, lines.length + 1, lineLimit));
            line = this._typesetter.createLine(lineRange);
            line.origin.y = y;
            y += line.size.height;
            if (y <= heightLimit){
                spacing = (this.attributes.lineSpacing - 1.0) * line.size.height;
                if (y + spacing > heightLimit){
                    line.size.height += heightLimit - y;
                }else if (spacing > 0){
                    line.size.height += spacing;
                }
                y += spacing;
                lines.push(line);
                remianingRange.advance(line.range.length);
            }
        } while (lineRange.length > 0 && remianingRange.length > 0 && y < heightLimit && lines.length < lineLimit);

        if (this.attributes.lineBreakMode == JSLineBreakMode.truncateTail && lines.length > 0){
            line = lines.pop();
            if (remianingRange.length > 0 && lineLimit > lines.length + 1){
                // we got truncated because of height.  Re-run the last line so it
                // gets broken according to truncation rules rather than work break
                lineRange = this._typesetter.suggestLineBreak(widthLimit, JSRange(line.range.location, line.range.length + remianingRange.length), this.attributes.lineBreakMode);
                line = this._typesetter.createLine(lineRange);
            }
            var truncated = line.truncatedLine(widthLimit);
            lines.push(truncated);
        }
        return this.constructFrame(lines, size, this.attributes);
    },

    effectiveLineBreakMode: function(frameLineBreakMode, lineNumber, lineLimit){
        switch (frameLineBreakMode){
            case JSLineBreakMode.truncateTail:
                if (lineNumber == lineLimit){
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

var JSTextParagraphAttributes = {
    minimumLineHeight: 0,
    lineSpacing: 1.0,
    textAlignment: JSTextAlignment.left,
    lineBreakMode: JSLineBreakMode.truncateTail
};

})();
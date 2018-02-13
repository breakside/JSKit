// #import "Foundation/JSObject.js"
// #import "Foundation/CoreTypes.js"
// #import "Foundation/JSAttributedString.js"
// #import "Foundation/JSFont.js"
// #import "Foundation/JSTextGlyphStorage.js"
// #import "Foundation/JSTextLine.js"
// #import "Foundation/JSTextRun.js"
/* global JSClass, JSObject, JSReadOnlyProperty, JSDynamicProperty, JSTextGlyphStorage, JSTextTypesetter, JSSize, JSRange, JSTextAlignment, JSTextLine, JSTextRun, JSPoint, JSAttributedString, JSFont, jslog_create */
'use strict';

(function(){

var logger = jslog_create("com.owenshaw.AlohaKit.typesetter");

JSClass("JSTextTypesetter", JSObject, {

    attributedString: JSDynamicProperty('_attributedString'),

    init: function(){
    },

    constructLine: function(runs, origin, width, textAlignment){
        return JSTextLine.initWithRuns(runs, origin, width, textAlignment);
    },

    constructAttachmentRun: function(attachment, size){
        return JSTextRun.initWithAttachment(attachment, size);
    },

    constructRun: function(glyphStorage, attributes){
        return JSTextRun.initWithGlyphStorage(glyphStorage, attributes);
    },

    constructGlyphStorage: function(font, location){
        return JSTextGlyphStorage.initWithFont(font, location);
    },

    createLine: function(origin, width, range, lineBreakMode, textAlignment){
        if (range.length === 0){
            return this._createEmptyLine(origin, width, range, textAlignment);
        }
        if (width === 0){
            return this._createUnconstrainedLine(origin, width, this._unconstrainedLineRange(range));
        }
        return this._createConstraintedLine();
    },

    _createEmptyLine: function(origin, width, range, textAlignment){
        var attributes = this._attributedString.attributesAtIndex(range.location);
        var font = JSTextTypesetter.FontFromAttributes(attributes);
        var glyphStorage = this.constructGlyphStorage(font, range.location);
        glyphStorage.push('\u200B');
        var run = this.constructRun(glyphStorage, attributes);
        return this.constructLine([run], origin, width, textAlignment);
    },

    _unconstrainedLineRange: function(range){
        var i = range.location;
        var l = range.end;
        while (i < l){
            ++i;
            if (this._attributedString.string[i] == "\n"){
                break;
            }
        }
        return JSRange(range.location, i - range.location);
    },

    _createUnconstrainedLine: function(origin, width, range){
        // No need to worry about line breaking, just make a line from the given range
        var runs = [];
        var run;
        var x = 0;
        var runIterator = this._attributedString.runIterator(range.location);
        var remainingRange = JSRange(range);
        do {
            run = this._createUnconstrainedRun(remainingRange.intersection(runIterator.range), runIterator.attributes);
            run.origin.x = x;
            x += run.size.width;
            runs.push(run);
            remainingRange.advance(run.range.length);
            runIterator.increment();
        } while (remainingRange.length > 0);
        // text alignment doesn't matter here because the line is only as wide as its content, so
        // there's no room to adjust the run layout.
        return this.constructLine(runs, origin, width, JSTextAlignment.Left);
    },

    _createUnconstrainedRun: function(range, attributes){
        var iterator = this._attributedString.string.unicodeIterator(range.location);

        // 1. Attachment Run
        if (range.length === 1 && iterator.character.code == JSAttributedString.SpecialCharacter.Attachment){
            // TODO: get attachment & size
            var attachment = null;
            var size = null;
            return this.constructAttachmentRun(attachment, size);
        }

        // 2. Glyph Run
        var font = JSTextTypesetter.FontFromAttributes(attributes);
        var glyphStorage = this.constructGlyphStorage(font, range.location);
        glyphStorage.push(this._attributedString.string.substringInRange(range));
        return this.constructRun(glyphStorage, attributes);
    },

    _createConstraintedLine: function(origin, width, range, lineBreakMode, textAlignment){
        var remainingRange = JSRange(range);
        var runIterator = this._attributedString.runIterator(range.location);
        var runs = [];
        var run;
        var i, l;
        var x = 0;
        do {
            run = this._createConstrainedRun(width - x, remainingRange.intersection(runIterator.range), runIterator.attributes, lineBreakMode);
            run.origin.x = x;
            x += run.size.width;
            if (run.range.length > 0){
                remainingRange.advance(run.range.length);
                runs.push(run);
            }
            if (remainingRange.location == runIterator.range.end){
                runIterator.increment();
            }
        } while (run.range.length > 0 && remainingRange.length > 0 && (width === 0 || x < width) && this._attributedString.string[remainingRange.location - 1] != "\n");
        return this.constructLine(runs, origin, width, JSRange(range.location, remainingRange.location - range.location), textAlignment);
    },

    _createConstrainedRun: function(width, range, attributes, lineBreakMode){
        var font = JSTextTypesetter.FontFromAttributes(attributes);
        var iterator = this._attributedString.userPerceivedCharacterIterator(range.location);

        // 1. Attachment run
        if (range.length === 1 && iterator.firstCharacter.code == JSAttributedString.SpecialCharacter.Attachment){
            // TODO: get attachment & size
            var attachment = null;
            var size = null;
            if (size.width <= width){
                return this.constructAttachmentRun(attachment, size);
            }
            // attachment won't fit, return an empty run to trigger a line wrap
            var emptyGlyphStorage = this.constructGlyphStorage(font, range.location);
            return this.constructRun(emptyGlyphStorage, attributes);
        }

        // 2. Glyph run
        var glyphStorage = this.constructGlyphStorage(font, range.location);
        var remainingRange = JSRange(range);
        do {
            // TODO: whitespace at the end of a line should not cause the span
            // width to grow beyond the line bounds
            if (iterator.firstCharacter.code != 0x0A){
                glyphStorage.push(iterator.utf16);
            }
            remainingRange.advance(iterator.range.length);
            iterator.increment();
        } while (remainingRange.length > 0 && glyphStorage.size.width < width && iterator.firstCharacter.code != 0x0A);
        if (glyphStorage.size.width > width){
            glyphStorage.pop();
            // back up according to line break mode
        }
        return this.constructRun(glyphStorage, attributes);
    },

});

JSTextTypesetter.FontFromAttributes = function(attributes){
    var font = attributes[JSAttributedString.Attribute.Font];
    if (attributes[JSAttributedString.Attribute.Bold]){
        font = font.fontWithWeight(JSFont.Weight.Bold);
    }
    if (attributes[JSAttributedString.Attribute.Italic]){
        font = font.fontWithStyle(JSFont.Style.Italic);
    }
    return font;
};

})();
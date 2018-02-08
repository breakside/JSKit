// #import "Foundation/JSObject.js"
/* global JSClass, JSObject, JSTextTypesetter, JSRange, JSTextLine, JSTextRun, JSPoint, JSAttributedString, JSFont */
'use strict';

(function(){

JSClass("JSTextTypesetter", JSObject, {

    init: function(){
    },

    constructLine: function(){
        return JSTextLine.init();
    },

    constructRun: function(attributes){
        return JSTextRun.initWithAttributes(attributes);
    },

    createLine: function(width, attributedString, range, lineBreakMode, textAlignment){
        range = JSRange(range);
        var runIterator = attributedString.runIterator(range.location);
        var line = this.constructLine(runIterator.attributes);
        var strut = this.constructRun(runIterator.attributes);
        strut.addUserPerceivedCharacter('\u200B');
        line.addStrut(strut);
        line.size.width = width;
        line.range.location = range.location;
        if (range.length === 0){
            line.range.length = 0;
            return line;
        }
        var run;
        var x = 0;
        do {
            run = this._createRun(width - x, attributedString.string, range.intersection(runIterator.range), runIterator.attributes, lineBreakMode);
            run.origin.x = x;
            x += run.size.width;
            if (run.range.length > 0){
                range.advance(run.range.length);
                line.addRun(run);
            }
            if (range.location == runIterator.range.end){
                runIterator.increment();
            }
        } while (run.range.length > 0 && range.length > 0 && (width === 0 || x < width) && attributedString.string[range.location - 1] != "\n");
        // TODO: right/center/justify alignment, but in a way that's easy to intercept
        // by a subclass like HTML that can do it with a simple instruction on the line
        line.range.length = range.location - line.range.location;
        return line;
    },

    _createRun: function(width, str, range, attributes, lineBreakMode){
        range = JSRange(range);
        var font = JSTextTypesetter.FontFromAttributes(attributes);
        var run = this.constructRun(attributes);
        run.range.location = range.location;
        var iterator = str.userPerceivedCharacterIterator(range.location);
        if (range.length === 1 && iterator.firstCharacter.code == JSAttributedString.SpecialCharacter.Attachment){
            // TODO: get attachment & size
            var attachment = null;
            var size = null;
            if (size.width <= width){
                run.addAttachment(attachment, size);
                run.range.length = 1;
            }
            run.size.width = size.width;
            run.size.height = size.height;
        }else{
            // run.size.height = font.lineHeight;
            do {
                // TODO: whitespace at the end of a line should not cause the span
                // width to grow beyond the line bounds
                if (iterator.firstCharacter.code != 0x0A){
                    run.addUserPerceivedCharacter(iterator.utf16);
                }
                range.advance(iterator.range.length);
                iterator.increment();
            } while (range.length > 0 && run.size.width < width && iterator.firstCharacter.code != 0x0A);
            while (run.size.width > width){
                iterator.decrement();
                run.removeTrailingCharacter(iterator.range.length);
                range.advance(-iterator.range.length);
                // back up according to line break mode
            }
            run.range.length = range.location - run.range.location;
        }
        return run;
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
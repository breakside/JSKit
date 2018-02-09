// #import "Foundation/JSObject.js"
/* global JSClass, JSObject, JSTextTypesetter, JSRange, JSTextAlignment, JSTextLine, JSTextRun, JSPoint, JSAttributedString, JSFont, jslog_create */
'use strict';

(function(){

var logger = jslog_create("com.owenshaw.AlohaKit.typesetter");

JSClass("JSTextTypesetter", JSObject, {

    init: function(){
    },

    constructLine: function(alignment){
        return JSTextLine.initWithAlignment(alignment);
    },

    constructRun: function(attributes){
        return JSTextRun.initWithAttributes(attributes);
    },

    createLine: function(width, attributedString, range, lineBreakMode, textAlignment){
        range = JSRange(range);
        var runIterator = attributedString.runIterator(range.location);
        var line = this.constructLine(textAlignment);
        var strut = this.constructRun(runIterator.attributes);
        strut.addUserPerceivedCharacter('\u200B');
        strut.range.location = range.location;
        strut.range.length = 0;
        strut.origin.x = 0;
        line.addStrut(strut);
        line.size.width = width;
        line.range.location = range.location;
        if (range.length === 0){
            line.range.length = 0;
            return line;
        }
        var run;
        var i, l;
        var x = 0;
        if (width === 0){
            // If the width in unconstrainted, then the line can only end at a new line character,
            // and we can optimize the run creation to do entire runs at a time instead of character
            // by character.
            var str = attributedString.string;
            i = range.location;
            l = range.end;
            while (i < l){
                ++i;
                if (attributedString.string[i] == "\n"){
                    break;
                }
            }
            range.length = i - range.location;
            do {
                run = this._createRun(0, attributedString.string, range.intersection(runIterator.range), runIterator.attributes, lineBreakMode);
                run.origin.x = x;
                x += run.size.width;
                range.advance(run.range.length);
                line.addRun(run);
                runIterator.increment();
            } while (range.length > 0);
            line.size.width = line.usedSize.width;
        }else{
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
            switch (textAlignment){
                case JSTextAlignment.Left:
                    break;
                case JSTextAlignment.Center:
                    for (i = 0, l = line.runs.length; i < l; ++i){
                        line.runs[i].origin.x += (line.size.width - line.usedSize.width) / 2.0;
                    }
                    break;
                case JSTextAlignment.Right:
                    for (i = 0, l = line.runs.length; i < l; ++i){
                        line.runs[i].origin.x += (line.size.width - line.usedSize.width);
                    }
                    break;
                case JSTextAlignment.Justify:
                    // TODO: ugh
                    break;
            }
        }
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
            if (width === 0){
                // if the width is unconstrainted, then we can write all the characters at once
                run.addCharacters(str.substringInRange(range));
                range.advance(range.length);
            }else{
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
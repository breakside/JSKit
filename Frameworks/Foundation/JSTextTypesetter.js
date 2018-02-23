// #import "Foundation/JSObject.js"
// #import "Foundation/CoreTypes.js"
// #import "Foundation/JSAttributedString.js"
// #import "Foundation/JSFont.js"
// #import "Foundation/JSTextGlyphStorage.js"
// #import "Foundation/JSTextLine.js"
// #import "Foundation/JSTextRun.js"
/* global JSClass, JSObject, JSReadOnlyProperty, JSDynamicProperty, JSTextGlyphStorage, JSTextTypesetter, JSSize, JSRange, JSTextAlignment, JSTextLine, JSTextRun, JSPoint, JSAttributedString, JSFont, jslog_create, JSLineBreakMode */
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

    constructAttachmentRun: function(attachment, size, range){
        return JSTextRun.initWithAttachment(attachment, size, range);
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
            return this._createUnconstrainedLine(origin, this._unconstrainedLineRange(range));
        }
        return this._createConstrainedLine(origin, width, range, lineBreakMode, textAlignment);
    },

    _createEmptyLine: function(origin, width, range, textAlignment){
        var attributes = this._attributedString.attributesAtIndex(range.location);
        var font = JSTextTypesetter.FontFromAttributes(attributes);
        var glyphStorage = this.constructGlyphStorage(font, range.location);
        glyphStorage.pushExtra('\u200B');
        var run = this.constructRun(glyphStorage, attributes);
        return this.constructLine([run], origin, width, textAlignment);
    },

    _unconstrainedLineRange: function(range){
        var i = range.location;
        var l = range.end;
        while (i < l){
            if (this._attributedString.string[i] == "\n"){ // FIXME: consider other line break codes
                ++i;
                break;
            }
            ++i;
        }
        return JSRange(range.location, i - range.location);
    },

    _createUnconstrainedLine: function(origin, range){
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
        return this.constructLine(runs, origin, 0, JSTextAlignment.Left);
    },

    _createUnconstrainedRun: function(range, attributes){
        var iterator = this._attributedString.string.unicodeIterator(range.location);

        // 1. Attachment Run
        if (range.length === 1 && iterator.character.code == JSAttributedString.SpecialCharacter.Attachment){
            // TODO: get attachment & size
            var attachment = null;
            var size = null;
            return this.constructAttachmentRun(attachment, size, range);
        }

        // 2. Glyph Run
        var font = JSTextTypesetter.FontFromAttributes(attributes);
        var glyphStorage = this.constructGlyphStorage(font, range.location);
        glyphStorage.push(this._attributedString.string.substringInRange(range));
        return this.constructRun(glyphStorage, attributes);
    },

    _createConstrainedLine: function(origin, width, range, lineBreakMode, textAlignment){
        var remainingRange = JSRange(range);
        var runDescriptors = [];
        var i, l;
        var usedWidth = 0;
        var usedPrintableWidth = 0;
        var newline = false;
        var iterator = this._attributedString.string.userPerceivedCharacterIterator(range.location);
        var runIterator = this._attributedString.runIterator(range.location);
        var initialLineAttributes = runIterator.attributes;
        var font;
        var glyphStorage = null;
        var printableRange = JSRange(range.location, 0);
        var printableRanges = [printableRange];
        var printable;

        // Create run descriptors that at least fill the line
        do {
            if (runIterator.range.length == 1 && iterator.firstCharacter.code == JSAttributedString.SpecialCharacter.Attachment){
                // attachment run
                // TODO: get attachment & size
                var attachment = null;
                var size = null;
                runDescriptors.push({attachment: attachment, size: size, range: JSRange(runIterator.range), attributes: runIterator.attributes});
                usedWidth += size.width;
                printable = true;
            }else{
                // glyph run
                if (glyphStorage === null){
                    font = JSTextTypesetter.FontFromAttributes(runIterator.attributes);
                    glyphStorage = this.constructGlyphStorage(font, remainingRange.location);
                    runDescriptors.push({glyphStorage: glyphStorage, attributes: runIterator.attributes});
                }
                newline = iterator.firstCharacter.code == 0x0A;  // FIXME: consider all line break codes
                printable = !newline && iterator.firstCharacter.code != 0x20; // FIXME: consider all whitespace codes
                usedWidth -= glyphStorage.width;
                glyphStorage.push(iterator.utf16);
                usedWidth += glyphStorage.width;
            }
            remainingRange.advance(iterator.range.length);
            if (printable){
                usedPrintableWidth = usedWidth;
                if (printableRange === null){
                    printableRange = JSRange(iterator.range);
                    printableRanges.push(printableRange);
                }else{
                    printableRange.length += iterator.range.length;
                }
            }else{
                printableRange = null;
            }
            iterator.increment();
            if (iterator.range.location >= runIterator.range.end){
                // NOTE: We expect iterator.location to fall on a run boundary, but
                // if it doesn't, then the run boundary splits a user-perceived character, and we'll
                // paint every byte of the character with the attributes that begin the character.
                // It's also technically possible for N runs to be in a N-length user-perceived
                // character, so we can't just assume that a single runIterator.increment() will get
                // us to the run that applies to the next user-perceived charater; therefore, we'll loop.
                // It is up to applications to ensure that run boundaries fall on user-perceived
                // character boundaries, but this code must assume that applications will do the
                // wrong thing, and handle those situations without crashing/looping forever/etc.
                do {
                    runIterator.increment();
                }while (runIterator.range.end < iterator.range.location);
                glyphStorage = null;
            }
        } while (remainingRange.length > 0 && usedPrintableWidth <= width && !newline);

        // Remove any characters causing overage, and add any truncation ellipsis
        var runDescriptor;
        if (usedPrintableWidth > width){

            if (lineBreakMode == JSLineBreakMode.WordWrap){
                // word wrapping

                iterator.decrement();
                var characterBreakLocation = iterator.range.location;
                // back up to a word boundary
                while (!iterator.isWordBoundary){
                    iterator.decrement();
                }
                if (iterator.range.location == range.location){
                    // we couldn't fit a word in, so break by character
                    usedWidth -= this._truncateRunDescriptorsToLocation(runDescriptors, characterBreakLocation);
                    this._truncateRangesToLocation(printableRanges, characterBreakLocation);
                }else{
                    usedWidth -= this._truncateRunDescriptorsToLocation(runDescriptors, iterator.range.location);
                    this._truncateRangesToLocation(printableRanges, iterator.range.location);
                }

            }else if (lineBreakMode == JSLineBreakMode.TruncateTail){
                // character truncation with ellipsis

                var ellipsis = "\u2026";
                while (usedWidth > width && runDescriptors.length > 0){
                    iterator.decrement();
                    usedWidth -= this._truncateRunDescriptorsToLocation(runDescriptors, iterator.range.location);
                    this._truncateRangesToLocation(printableRanges, iterator.range.location);
                    if (runDescriptors.length === 0){
                        // We've cut all the way back to the beginning of the line, try to show just an ellipsis,
                        // and finally show nothing if even the ellipsis won't fit.
                        glyphStorage = this.constructGlyphStorage(JSTextTypesetter.FontFromAttributes(initialLineAttributes), range.location);
                        glyphStorage.pushExtra(ellipsis);
                        if (glyphStorage.width <= width){
                            usedWidth = glyphStorage.width;
                            runDescriptors.push({glyphStorage: glyphStorage, attributes: initialLineAttributes});
                            printableRanges[0].length = 1;
                        }else{
                            usedWidth = 0;
                        }
                    }else{
                        runDescriptor = runDescriptors[runDescriptors.length - 1];
                        if (runDescriptor.attachment){
                            // The final descriptor is an attachment, so add a new glyph run for the ellipsis
                            glyphStorage = this.constructGlyphStorage(JSTextTypesetter.FontFromAttributes(runDescriptor.attributes), runDescriptor.range.end);
                            glyphStorage.pushExtra(ellipsis);
                            usedWidth += glyphStorage.width;
                            printableRanges[printableRanges.length - 1].length += 1;
                        }else{
                            // Add the ellipsis to the end of the final glyph run
                            usedWidth -= runDescriptor.glyphStorage.width;
                            runDescriptor.glyphStorage.pushExtra(ellipsis);
                            usedWidth += runDescriptor.glyphStorage.width;
                            if (printableRanges[printableRanges.length - 1].end == runDescriptor.glyphStorage.range.end){
                                printableRanges[printableRanges.length - 1].length += 1;
                            }else{
                                printableRanges.push(JSRange(runDescriptor.glyphStorage.range.end, 1));
                            }
                        }
                    }
                }

            }else{
                // character wrapping (or unknown/invalid line break mode value)
                iterator.decrement();
                usedWidth -= this._truncateRunDescriptorsToLocation(runDescriptors, iterator.range.location);
                this._truncateRangesToLocation(printableRanges, iterator.range.location);
            }
        }

        // remove non-printable trailing glyphs
        // NOTE: while we could remove any runs that become empty after trimming
        // whitespace, I prefer to keep them intact as 0-width, but non-0 range
        // runs, which ensures that the range of every run in the line equals
        // the range of the line.
        if (runDescriptors.length > 0){
            i = runDescriptors.length - 1;
            runDescriptor = runDescriptors[i];
            // non-printable characters can only happen with glyph runs, so there's nothing to do if we see an attachment run
            if (!runDescriptor.attachment){
                var printableEnd = printableRanges[printableRanges.length - 1].end;
                var trimLocation = runDescriptor.glyphStorage.range.end;
                while (trimLocation > printableEnd && usedWidth > width){
                    --trimLocation;
                    runDescriptor = runDescriptors[i];
                    usedWidth -= runDescriptor.glyphStorage.width;
                    runDescriptor.glyphStorage.trimTrailingWhitespace(runDescriptor.glyphStorage.range.end - trimLocation);
                    usedWidth += runDescriptor.glyphStorage.width;
                    if (trimLocation == runDescriptor.glyphStorage.range.location){
                        --i;
                    }
                }
            }
        }

        // Create runs from the adjusted run descriptors
        var runs = [];
        var run;
        var x = 0;
        for (i = 0, l = runDescriptors.length; i < l; ++i){
            run = this._createRunFromRunDescriptor(runDescriptors[i]);
            run.origin.x = x;
            x += run.size.width;
            runs.push(run);
        }

        if (runs.length === 0){
            return this._createEmptyLine(origin, width, range, textAlignment);
        }

        // Create a line from the runs
        return this.constructLine(runs, origin, width, textAlignment);
    },

    _truncateRunDescriptorsToLocation: function(runDescriptors, location){
        var runDescriptor;
        var end = location + 1;
        var removedWidth = 0;
        while (runDescriptors.length > 0 && end > location){
            runDescriptor = runDescriptors[runDescriptors.length - 1];
            if (runDescriptor.attachment){
                end = runDescriptor.range.location;
                removedWidth += runDescriptor.width;
                runDescriptors.pop();
            }else{
                end = runDescriptor.glyphStorage.range.location;
                removedWidth += runDescriptor.glyphStorage.width;
                if (end >= location){
                    runDescriptors.pop();
                }else{
                    runDescriptor.glyphStorage.truncate(location - runDescriptor.glyphStorage.range.location);
                    removedWidth -= runDescriptor.glyphStorage.width;
                }
            }
        }
        return removedWidth;
    },

    _truncateRangesToLocation: function(ranges, location){
        var end = location + 1;
        var range;
        while (ranges.length > 0 && end > location){
            range = ranges[ranges.length - 1];
            end = range.location;
            if (end >= location){
                ranges.pop();
            }else{
                range.length = location - range.location;
            }
        }
        if (ranges.length === 0){
            ranges.push(JSRange(location, 0));
        }
    },

    _createRunFromRunDescriptor: function(runDescriptor){
        if (runDescriptor.glyphStorage){
            return this.constructRun(runDescriptor.glyphStorage, runDescriptor.attributes);
        }
        if (runDescriptor.attachment){
            this.constructAttachmentRun(runDescriptor.attachment, runDescriptor.size, runDescriptor.range);
        }
        throw Error("Invalid run descriptor");
    }

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
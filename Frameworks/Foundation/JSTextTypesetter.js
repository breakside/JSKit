// #import "Foundation/JSObject.js"
// #import "Foundation/CoreTypes.js"
// #import "Foundation/JSAttributedString.js"
// #import "Foundation/JSFont.js"
// #import "Foundation/JSTextLine.js"
// #import "Foundation/JSTextRun.js"
/* global JSClass, JSObject, JSReadOnlyProperty, JSDynamicProperty, JSTextTypesetter, JSAttachmentFont, JSSize, JSRange, JSTextAlignment, JSTextLine, JSTextRun, JSPoint, JSAttributedString, JSFont, jslog_create, JSLineBreakMode */
'use strict';

(function(){

var logger = jslog_create("com.owenshaw.AlohaKit.typesetter");

JSClass("JSTextTypesetter", JSObject, {

    attributedString: JSDynamicProperty('_attributedString'),
    _suggestedLineLayout: null,

    // MARK: - Creating a typesetter

    init: function(){
    },

    setAttributedString: function(attributedString){
        this._attributedString = attributedString;
    },

    // MARK: - Creating a Line

    createLine: function(range){
        if (range.length === 0){
            return this._createEmptyLine(range);
        }
        var layout = this._suggestedLineLayout;
        if (layout === null || !range.isEqual(layout.range)){
            layout = this._layoutLine(Number.MAX_VALUE, range, JSLineBreakMode.characterWrap);
        }
        return this._createLineFromLayout(layout);
    },

    suggestLineBreak: function(width, range, lineBreakMode){
        if (range.length === 0){
            return JSRange(range);
        }
        if (width === 0){
            width = Number.MAX_VALUE;
        }
        this._suggestedLineLayout = this._layoutLine(width, range, lineBreakMode);
        return this._suggestedLineLayout.range;
    },

    // MARK: - Private Helpers for Line Creation

    _createEmptyLine: function(range){
        var attributes = this._attributedString.attributesAtIndex(range.location);
        var font = JSTextTypesetter.FontFromAttributes(attributes);
        return JSTextLine.initWithHeight(font.lineHeight, range.location);
    },

    _createLineFromLayout: function(layout){
        // Create runs from the adjusted run descriptors
        var runs = [];
        var run;
        var x = 0;
        var runDescriptor;
        for (var i = 0, l = layout.runDescriptors.length; i < l; ++i){
            runDescriptor = layout.runDescriptors[i];
            run = JSTextRun.initWithGlyphs(runDescriptor.glyphs, runDescriptor.glyphCharacterLengths, runDescriptor.font, runDescriptor.attributes, JSRange(runDescriptor.location, runDescriptor.length));
            run.origin.x = x;
            x += run.size.width;
            runs.push(run);
        }

        if (runs.length === 0){
            return this._createEmptyLine(layout.range);
        }

        // Create a line from the runs
        return JSTextLine.initWithRuns(runs, layout.trailingWhitespaceWidth);
    },

    // MARK: - Private Helpers for Line Break Suggestion

    fallbackFontsForFont: function(font){
        // TODO: use font descriptor to choose an appropriate fallback font
        return [];
    },

    fallbackFontForCharacter: function(character, preferredFont, defaultFont){
        var i = 0;
        var fallbackFonts = this.fallbackFontsForFont(preferredFont);
        while (i < fallbackFonts.length){
            if (fallbackFonts[i].glyphForCharacter(character) > 0){
                return fallbackFonts[i];
            }
            ++i;
        }
        return defaultFont;
    },

    _layoutLine: function(width, range, lineBreakMode){
        var remainingRange = JSRange(range);
        var runDescriptors = [];
        var i, l;
        var usedWidth = 0;
        var newline = false;
        var glyph;
        var runDescriptor = null;
        var printableRange = JSTextTypesetterPrintableRange(range.location, 0, 0);
        var printableRanges = [printableRange];
        var printable;
        var preferredFont = null;
        var fallbackFont = null;

        var iterator = this._attributedString.string.userPerceivedCharacterIterator(range.location);
        var runIterator = this._attributedString.runIterator(range.location);
        var initialLineAttributes = runIterator.attributes;
        var codeIterator;
        // Create run descriptors that at fill the line, maybe going a bit over
        do {

            // If we're at the start of a new run, make a new run descriptor
            if (runDescriptor === null){
                runDescriptor = JSTextTypesetterRunDescriptor(remainingRange.location, runIterator.attributes);
                runDescriptors.push(runDescriptor);
                preferredFont = runDescriptor.font;
            }

            // Check some properties of this character
            newline = iterator.isMandatoryLineBreak;
            printable = !newline && !iterator.isWhiteSpace;

            // Adjust the run's font if needed
            if (runIterator.range.length == 1 && iterator.firstCharacter.code == JSAttributedString.SpecialCharacter.Attachment){
                // 1. Attachment font:
                // Attachment runs use a special "attachment font" that can draw the attachment rather
                // than draw a glyph.  It's perhaps a little strange to call an attachment a font, but
                // the resulting code ends up cleaner since nothing else has to care that the glyph
                // here is actually a specially drawn attachment.  The attachment font has a single glyph
                // that corresponds to the 0xFFFC attachment character code, whose width matches the
                // attachment's width
                runDescriptor.font = JSAttachmentFont.initWithAttachment(runIterator.attributes[JSAttributedString.Attribute.attachment]);
            }else{
                // 2. Fallback fonts:
                // If the character is not found in the run's font, switch to a fallback, creating
                // a new run if necessary.
                if (preferredFont.glyphForCharacter(iterator.firstCharacter) !== 0){
                    // If our preferred font has a glyph for the character, but we're in a run
                    // that is using a fallback font, create a new run, switching back to the preferred font
                    if (runDescriptor.font !== preferredFont){
                        runDescriptor = JSTextTypesetterRunDescriptor(remainingRange.location, runIterator.attributes);
                        runDescriptors.push(runDescriptor);
                    }
                }else{
                    // If our preferred font doesn't have a glyph for the character, find the best matching font to use
                    // as a fallback
                    fallbackFont = this.fallbackFontForCharacter(iterator.firstCharacter, preferredFont, runDescriptor.font);
                    // If the fallback doesn't match our run, adjust the run or create a new run depending on if it's emtpy
                    if (fallbackFont !== runDescriptor.font){
                        if (runDescriptor.length > 0){
                            runDescriptor = JSTextTypesetterRunDescriptor(remainingRange.location, runIterator.attributes);
                            runDescriptors.push(runDescriptor);
                        }
                        runDescriptor.font = fallbackFont;
                    }
                }
            }
            // newline characters do not result in glyphs, but we should still
            // count them in the run descriptor length so the resulting JSRun
            // has the correct range including the newline
            if (!newline){
                codeIterator = iterator.utf16.unicodeIterator();
                while (codeIterator.character !== null){
                    glyph = runDescriptor.font.glyphForCharacter(codeIterator.character);
                    usedWidth += runDescriptor.font.widthOfGlyph(glyph);
                    runDescriptor.glyphs.push(glyph);
                    runDescriptor.glyphCharacterLengths.push(codeIterator.nextIndex - codeIterator.index);
                    codeIterator.increment();
                }
            }
            runDescriptor.length += iterator.range.length;
            remainingRange.advance(iterator.range.length);
            if (printable){
                if (printableRange === null){
                    printableRange = JSTextTypesetterPrintableRange(iterator.range.location, iterator.range.length, usedWidth);
                    printableRanges.push(printableRange);
                }else{
                    printableRange.length += iterator.range.length;
                    printableRange.width = usedWidth;
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
                runDescriptor = null;
            }
        } while (remainingRange.length > 0 && printableRanges[printableRanges.length - 1].width <= width && !newline);

        // Remove any characters causing overage
        // But do nothing in truncation mode, just let the final character overflow so it can
        // be appropriately truncated by the caller
        if (printableRanges[printableRanges.length - 1].width > width && lineBreakMode != JSLineBreakMode.truncateTail){

            if (lineBreakMode == JSLineBreakMode.wordWrap){
                // word wrapping

                iterator.decrement();
                var characterBreakLocation = iterator.range.location;
                // back up to a word boundary
                while (iterator.index > range.location && !iterator.isWordBoundary){
                    iterator.decrement();
                }
                if (iterator.range.location <= range.location){
                    // we couldn't fit a word in, so break by character
                    usedWidth -= this._truncateRunDescriptorsToLocation(runDescriptors, characterBreakLocation);
                    this._truncateRangesToLocation(printableRanges, characterBreakLocation);
                }else{
                    usedWidth -= this._truncateRunDescriptorsToLocation(runDescriptors, iterator.range.location);
                    this._truncateRangesToLocation(printableRanges, iterator.range.location);
                }
            }else{
                // character wrapping (or unknown/invalid line break mode value)
                iterator.decrement();
                usedWidth -= this._truncateRunDescriptorsToLocation(runDescriptors, iterator.range.location);
                this._truncateRangesToLocation(printableRanges, iterator.range.location);
            }

            printableRanges[printableRanges.length - 1].width = Math.min(usedWidth, printableRanges[printableRanges.length - 1].width);
        }

        if (runDescriptors.length > 0){
            var lastDescriptor = runDescriptors[runDescriptors.length - 1];
            return {
                runDescriptors: runDescriptors,
                range: JSRange(range.location, lastDescriptor.location + lastDescriptor.length - range.location),
                trailingWhitespaceWidth: usedWidth - printableRanges[printableRanges.length - 1].width
            };
        }

        return {
            runDescriptors: [],
            range: JSRange(range.location, 0),
            trailingWhitespaceWidth: 0
        };
    },

    _truncateRunDescriptorsToLocation: function(runDescriptors, location){
        var runDescriptor;
        var end = location + 1;
        var removedWidth = 0;
        var glyph;
        var characterLength;
        var i, l;
        while (runDescriptors.length > 0 && end > location){
            runDescriptor = runDescriptors[runDescriptors.length - 1];
            end = runDescriptor.location + runDescriptor.length;
            while (end > location && runDescriptor.glyphs.length > 0){
                glyph = runDescriptor.glyphs.pop();
                removedWidth += runDescriptor.font.widthOfGlyph(glyph);
                characterLength = runDescriptor.glyphCharacterLengths.pop();
                runDescriptor.length -= characterLength;
                end -= characterLength;
            }
            if (runDescriptor.glyphs.length === 0){
                runDescriptors.pop();
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
            ranges.push(JSTextTypesetterPrintableRange(location, 0, 0));
        }
    }

});

var JSTextTypesetterRunDescriptor = function(location, attributes){
    if (this === undefined){
        return new JSTextTypesetterRunDescriptor(location, attributes);
    }
    if (location instanceof JSTextTypesetterRunDescriptor){
        this.location = location.location;
        this.attributes = location.attributes;
        this.length = location.length;
        this.glyphs = location.glyphs;
        this.glyphCharacterLengths = location.glyphCharacterLengths;
        this.font = location.font;
    }else{
        this.location = location;
        this.attributes = attributes;
        this.length = 0;
        this.glyphs = [];
        this.glyphCharacterLengths = [];
        this.font = JSTextTypesetter.FontFromAttributes(attributes);
    }
};

var JSTextTypesetterPrintableRange = function(location, length, width){
    if (this === undefined){
        return new JSTextTypesetterPrintableRange(location, length, width);
    }
    if (location instanceof JSTextTypesetterPrintableRange){
        this.location = location.location;
        this.length = location.length;
        this.width = location.width;
    }else{
        this.location = location;
        this.length = length;
        this.width = width;
    }
};

JSTextTypesetter.FontFromAttributes = function(attributes){
    var font = attributes[JSAttributedString.Attribute.font];
    if (attributes[JSAttributedString.Attribute.bold]){
        font = font.fontWithWeight(JSFont.Weight.bold);
    }
    if (attributes[JSAttributedString.Attribute.italic]){
        font = font.fontWithStyle(JSFont.Style.italic);
    }
    return font;
};

})();
// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #import "JSObject.js"
// #import "CoreTypes.js"
// #import "JSTextTypesetter.js"
// #import "JSTextFrame.js"
// #import "JSAttributedString.js"
// #import "JSParagraphStyle.js"
'use strict';

(function(){

var logger = JSLog("foundation", "text");

JSClass("JSTextFramesetter", JSObject, {

    typesetter: JSReadOnlyProperty('_typesetter', null),
    attributedString: JSDynamicProperty(),
    defaultParagraphStyle: JSDynamicProperty("_defaultParagraphStyle", null),

    init: function(){
        this.initWithTypesetter(JSTextTypesetter.init());
    },

    initWithTypesetter: function(typesetter){
        this._typesetter = typesetter;
        this._defaultParagraphStyle = JSParagraphStyle.init();
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

    createFrame: function(size, range, maximumLines){
        var remainingRange = JSRange(range);
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
        var lineWidthLimit;
        var attributes = this._typesetter.resolveAttributes(this._typesetter.attributedString.attributesAtIndex(remainingRange.location));
        var paragraphStyle = this._defaultParagraphStyle.styleWithAttributes(attributes);
        var characterIterator = this._typesetter.attributedString.string.userPerceivedCharacterIterator(remainingRange.location);
        var listNumberStack = [];
        var markerText = "";
        var markerRun;
        characterIterator.decrement();
        do{
            lineWidthLimit = widthLimit;
            if (lineWidthLimit < Number.MAX_VALUE){
                if (characterIterator.isParagraphBreak){
                    lineWidthLimit -= paragraphStyle.firstLineHeadIndent;
                }else{
                    lineWidthLimit -= paragraphStyle.headIndent;
                }
                lineWidthLimit -= paragraphStyle.tailIndent;
                if (paragraphStyle.listLevel > 0){
                    lineWidthLimit -= paragraphStyle.listIndent + paragraphStyle.listMarkerWidth;
                }
            }
            while (paragraphStyle.listLevel < listNumberStack.length){
                listNumberStack.pop();
            }
            if (paragraphStyle.listLevel > 0 && characterIterator.isParagraphBreak){
                if (paragraphStyle.listLevel > listNumberStack.length){
                    while (paragraphStyle.listLevel > listNumberStack.length){
                        listNumberStack.push(1);
                    }
                    listNumberStack[paragraphStyle.listLevel - 1] = this._typesetter.attributedString.listItemNumberAtIndex(remainingRange.location);
                }
                markerText = paragraphStyle.markerTextForListItemNumber(listNumberStack[paragraphStyle.listLevel - 1]);
                ++listNumberStack[paragraphStyle.listLevel - 1];
                markerRun = this._typesetter._createMarkerRun(markerText, remainingRange.location);
                if (markerRun.size.width > paragraphStyle.listMarkerWidth){
                    lineWidthLimit -= markerRun.size.width;
                }else{
                    lineWidthLimit -= paragraphStyle.listMarkerWidth;
                }
            }else{
                markerRun = null;
            }
            lineRange = this._typesetter.suggestLineBreak(lineWidthLimit, remainingRange, this.effectiveLineBreakMode(paragraphStyle.lineBreakMode, lines.length + 1, lineLimit));
            line = this._typesetter.createLine(lineRange);
            line.origin.y = y;
            line.markerRun = markerRun;
            if (paragraphStyle.lineHeightMultiple > 0){
                line.size.height *= paragraphStyle.lineHeightMultiple;
            }
            if (line.size.height < paragraphStyle.minimumLineHeight){
                line.size.height = paragraphStyle.minimumLineHeight;
            }
            if (line.markerRun !== null){
                line.markerRun.origin.y = line.origin.y + line.size.height - line.baseline - markerRun.size.height + markerRun.baseline;
            }
            y += line.size.height;
            if (y <= heightLimit){
                remainingRange.advance(line.range.length);
                characterIterator = this._typesetter.attributedString.string.userPerceivedCharacterIterator(remainingRange.location);
                characterIterator.decrement();
                if (characterIterator.isParagraphBreak){
                    y += Math.max(0, Math.min(heightLimit - y, paragraphStyle.paragraphSpacing));
                    attributes = this._typesetter.resolveAttributes(this._typesetter.attributedString.attributesAtIndex(remainingRange.location));
                    paragraphStyle = this._defaultParagraphStyle.styleWithAttributes(attributes);
                    y += Math.max(0, Math.min(heightLimit - y, paragraphStyle.beforeParagraphSpacing));
                }
                y += Math.max(0, Math.min(heightLimit - y, paragraphStyle.lineSpacing));
                lines.push(line);
            }
        } while (lineRange.length > 0 && remainingRange.length > 0 && y < heightLimit && lines.length < lineLimit);

        if (paragraphStyle.lineBreakMode == JSLineBreakMode.truncateTail && lines.length > 0){
            line = lines.pop();
            if (remainingRange.length > 0 && lineLimit > lines.length + 1){
                // we got truncated because of height.  Re-run the last line so it
                // gets broken according to truncation rules rather than word break
                y = line.origin.y;
                lineRange = this._typesetter.suggestLineBreak(widthLimit, JSRange(line.range.location, line.range.length + remainingRange.length), paragraphStyle.lineBreakMode);
                line = this._typesetter.createLine(lineRange);
                line.origin.y = y;
                line = line.truncatedLine(widthLimit, undefined, true);
                lines.push(line);
            }else{
                line = line.truncatedLine(widthLimit);
                lines.push(line);
            }
        }
        var frame = this.constructFrame(lines, size);
        this._alignLinesInFrame(frame);
        return frame;
    },

    _resizeFrame: function(frame, size){
        if (size.width < frame._usedSize.width || size.height < frame._usedSize.height){
            throw new Error("Cannot adjust text frame to smaller than its used size");
        }
        frame._size = JSSize(size);
        this._alignLinesInFrame(frame);
    },

    _alignLinesInFrame: function(frame){
        var i, l;
        var line;
        var attributes;
        var headIndent = 0;
        var characterIterator;
        var paragraphStyle;
        for (i = 0, l = frame.lines.length; i < l; ++i){
            line = frame.lines[i];
            attributes = this._typesetter.resolveAttributes(this._typesetter.attributedString.attributesAtIndex(line.range.location));
            paragraphStyle = this._defaultParagraphStyle.styleWithAttributes(attributes);
            characterIterator = this._typesetter.attributedString.string.userPerceivedCharacterIterator(line.range.location);
            characterIterator.decrement();
            if (characterIterator.isParagraphBreak){
                headIndent = paragraphStyle.firstLineHeadIndent;
            }else{
                headIndent = paragraphStyle.headIndent;
            }
            if (paragraphStyle.listLevel > 0){
                headIndent += paragraphStyle.listIndent + paragraphStyle.listMarkerWidth;
            }
            if (paragraphStyle.textAlignment === JSTextAlignment.left){
                line.origin.x = headIndent;
            }else if (paragraphStyle.textAlignment === JSTextAlignment.center){
                line.origin.x = headIndent + (frame._size.width - headIndent - paragraphStyle.tailIndent - line.size.width + line.trailingWhitespaceWidth) / 2.0;
            }else if (paragraphStyle.textAlignment === JSTextAlignment.right){
                line.origin.x = (frame._size.width - line.size.width + line.trailingWhitespaceWidth) - paragraphStyle.tailIndent;
            }
            if (line.markerRun !== null){
                line.markerRun.origin.x = headIndent - paragraphStyle.listMarkerWidth;
            }
        }
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
    },

    // Deprecated:

    attributes: JSReadOnlyProperty("_attributes", null),

    getAttributes: function(){
        logger.warn("JSTextFramesetter.attributes is deprecated, use JSTextFramesetter.defaultParagraphStyle");
        if (this._attributes === null){
            var framesetter = this;
            this._attributes = Object.create({}, {
                lineBreakMode: {
                    get: function(){
                        return framesetter._defaultParagraphStyle.lineBreakMode;
                    },
                    set: function(lineBreakMode){
                        framesetter._defaultParagraphStyle.lineBreakMode = lineBreakMode;
                    }
                },
                textAlignment: {
                    get: function(){
                        return framesetter._defaultParagraphStyle.textAlignment;
                    },
                    set: function(textAlignment){
                        framesetter._defaultParagraphStyle.textAlignment = textAlignment;
                    }
                },
                lineSpacing: {
                    get: function(){
                        return framesetter._defaultParagraphStyle.lineHeightMultiple > 0 ? framesetter._defaultParagraphStyle.lineHeightMultiple : 1.0;
                    },
                    set: function(lineSpacing){
                        framesetter._defaultParagraphStyle.lineHeightMultiple = lineSpacing;
                    }
                },
                minimumLineHeight: {
                    get: function(){
                        return framesetter._defaultParagraphStyle.minimumLineHeight;
                    },
                    set: function(minimumLineHeight){
                        framesetter._defaultParagraphStyle.minimumLineHeight = minimumLineHeight;
                    }
                }
            });
        }
        return this._attributes;
    }

});

})();
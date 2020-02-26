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
'use strict';

(function(){

JSClass("JSTextFramesetter", JSObject, {

    typesetter: JSReadOnlyProperty('_typesetter', null),
    attributedString: JSDynamicProperty(),
    attributes: null,

    init: function(){
        this.initWithTypesetter(JSTextTypesetter.init());
    },

    initWithTypesetter: function(typesetter){
        this._typesetter = typesetter;
        this.attributes = Object.create(JSTextParagraphAttributes);
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
        var spacing = 0;
        do{
            lineRange = this._typesetter.suggestLineBreak(widthLimit, remianingRange, this.effectiveLineBreakMode(this.attributes.lineBreakMode, lines.length + 1, lineLimit));
            line = this._typesetter.createLine(lineRange);
            line.origin.y = y;
            y += line.size.height;
            if (y <= heightLimit){
                spacing = Math.min(heightLimit - y, (this.attributes.lineSpacing - 1.0) * line.size.height);
                line.size.height += Math.max(0, spacing);
                y += spacing;
                lines.push(line);
                remianingRange.advance(line.range.length);
            }else{
                spacing = 0;
            }
        } while (lineRange.length > 0 && remianingRange.length > 0 && y < heightLimit && lines.length < lineLimit);

        if (this.attributes.lineBreakMode == JSLineBreakMode.truncateTail && lines.length > 0){
            line = lines.pop();
            if (remianingRange.length > 0 && lineLimit > lines.length + 1){
                // we got truncated because of height.  Re-run the last line so it
                // gets broken according to truncation rules rather than word break
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
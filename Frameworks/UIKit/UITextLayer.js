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

// #import "UILayer.js"
// #import "UITextFramesetter.js"
'use strict';

(function(){

JSClass("UITextLayer", UILayer, {

    text: JSDynamicProperty(),
    attributedText: JSDynamicProperty(),
    font: JSDynamicProperty(),
    textColor: UILayerAnimatedProperty(),
    lineBreakMode: JSDynamicProperty(),
    textAlignment: JSDynamicProperty(),
    lineSpacing: JSDynamicProperty(),
    minimumLineHeight: JSDynamicProperty(),
    textInsets: JSDynamicProperty('_textInsets', JSInsets.Zero),
    maximumNumberOfLines: JSDynamicProperty(),
    widthTracksText: JSDynamicProperty('_widthTracksText', false),
    heightTracksText: JSDynamicProperty('_heightTracksText', false),

    _textStorage: null,
    textLayoutManager: JSReadOnlyProperty('_textLayoutManager', null),
    textContainer: JSReadOnlyProperty('_textContainer', null),

    // MARK: - Creating a UITextLayer

    init: function(){
        UITextLayer.$super.init.call(this);
        this._commonTextLayerInit();
    },

    _commonTextLayerInit: function(){
        this._textLayoutManager = JSTextLayoutManager.init();
        this._textLayoutManager.delegate = this;
        this._textContainer = JSTextContainer.initWithSize(this._availableTextSize());
        this._textContainer.framesetter = UITextFramesetter.init();
        this._textStorage = JSTextStorage.init();
        this._textStorage.addLayoutManager(this._textLayoutManager);
        this._textLayoutManager.addTextContainer(this._textContainer);
        this.model.textColor = JSColor.black;
        this.font = JSFont.systemFontOfSize(JSFont.Size.normal);
        this.setNeedsLayout();
    },

    didChangeSize: function(){
        this._textContainer.size = this._availableTextSize();
        UITextLayer.$super.didChangeSize.call(this);
    },

    // MARK: - Styling

    getFont: function(){
        return this._textLayoutManager.defaultFont;
    },

    setFont: function(font){
        if (font === this._textLayoutManager.defaultFont){
            return;
        }
        this._textLayoutManager.defaultFont = font;
    },
    
    setTextInsets: function(insets){
        this._textInsets = JSInsets(insets);
        this._textContainer.size = this._availableTextSize();
    },

    getMaximumNumberOfLines: function(){
        return this._textContainer.maximumNumberOfLines;
    },

    setMaximumNumberOfLines: function(maxLines){
        this._textContainer.maximumNumberOfLines = maxLines;
        this._textContainer.size = this._availableTextSize();
    },

    getWidthTracksText: function(){
        return this._widthTracksText;
    },

    setWidthTracksText: function(widthTracksText){
        this._widthTracksText = widthTracksText;
        this._textContainer.size = this._availableTextSize();
    },

    getHeightTracksText: function(){
        return this._heightTracksText;
    },

    setHeightTracksText: function(heightTracksText){
        this._heightTracksText = heightTracksText;
        this._textContainer.size = this._availableTextSize();
    },

    // MARK: - Paragraph Styling

    getLineBreakMode: function(){
        return this._textLayoutManager.defaultParagraphStyle.lineBreakMode;
    },

    setLineBreakMode: function(lineBreakMode){
        this._textLayoutManager.defaultParagraphStyle = this._textLayoutManager.defaultParagraphStyle.styleWithAttributes({lineBreakMode: lineBreakMode});
    },

    getTextAlignment: function(){
        return this._textLayoutManager.defaultParagraphStyle.textAlignment;
    },

    setTextAlignment: function(textAlignment){
        this._textLayoutManager.defaultParagraphStyle = this._textLayoutManager.defaultParagraphStyle.styleWithAttributes({textAlignment: textAlignment});
    },

    getLineSpacing: function(){
        return this._textLayoutManager.defaultParagraphStyle.lineSpacing;
    },

    setLineSpacing: function(lineSpacing){
        this._textLayoutManager.defaultParagraphStyle = this._textLayoutManager.defaultParagraphStyle.styleWithAttributes({lineSpacing: lineSpacing});
    },

    getMinimumLineHeight: function(){
        return this._textLayoutManager.defaultParagraphStyle.minimumLineHeight;
    },

    setMinimumLineHeight: function(minimumLineHeight){
        this._textLayoutManager.defaultParagraphStyle = this._textLayoutManager.defaultParagraphStyle.styleWithAttributes({minimumLineHeight: minimumLineHeight});
    },

    // MARK: - Fetching & Updating Text

    hasText: function(){
        return this._textStorage.string !== null && this._textStorage.string.length > 0;
    },

    getText: function(){
        return this._textStorage.string;
    },

    setText: function(text){
        if (text === null || text === undefined){
            text = "";
        }
        this.setAttributedText(JSAttributedString.initWithString(text));
    },

    getAttributedText: function(){
        return this._textStorage;
    },

    setAttributedText: function(text){
        if (!text.isKindOfClass(JSTextStorage)){
            text = JSTextStorage.initWithAttributedString(text);
        }
        this._textStorage = text;
        this._textLayoutManager.replaceTextStorage(this._textStorage);
        this.setNeedsDisplay();
        this._displayQueued = true;
    },

    // MARK: - Converting coordinates to Text Container

    convertPointToTextContainer: function(point){
        return JSPoint(point.x - this._textContainer.origin.x, point.y - this._textContainer.origin.y);
    },

    // MARK: - Drawing

    _availableTextSize: function(){
        var width = this.bounds.size.width - this._textInsets.left - this._textInsets.right;
        var height = this.bounds.size.height - this._textInsets.top - this._textInsets.bottom;
        if (this._widthTracksText){
            width = Number.MAX_VALUE;
        }
        if (this._heightTracksText){
            height = Number.MAX_VALUE;
        }
        return JSSize(width, height);
    },

    drawInContext: function(context){
        var textOrigin = JSPoint(this._textInsets.left, this._textInsets.top);
        this._textLayoutManager.defaultTextColor = this.presentation.textColor;
        this._textLayoutManager.layoutIfNeeded();
        this._textLayoutManager.drawContainerInContextAtPoint(this._textContainer, context, textOrigin);
        this._displayQueued = false;
    },

    integerSizeRequired: true,

    sizeToFitSize: function(maxSize){
        var size = JSSize(maxSize);
        if (size.width < Number.MAX_VALUE){
            size.width -= this._textInsets.width;
        }
        if (size.height < Number.MAX_VALUE){
            size.height -= this._textInsets.height;
        }
        this._textContainer.size = size;
        this.layoutIfNeeded();
        if (this._textContainer.textFrame !== null){
            size = JSSize(this._textContainer.textFrame.usedSize);
            size.width += this._textInsets.width;
            size.height += this._textInsets.height;
            if (this.integerSizeRequired){
                size.width = Math.ceil(size.width);
                size.height = Math.ceil(size.height);
            }
            this.bounds = JSRect(JSPoint.Zero, size);
            this._textContainer.size = this._availableTextSize();
        }
    },

    layoutSublayers: function(){
        UITextLayer.$super.layoutSublayers.call(this);
        this._textContainer.origin = JSPoint(this._textInsets.left, this._textInsets.top);
        this._textLayoutManager.defaultTextColor = this.presentation.textColor;
        this._textLayoutManager.layoutIfNeeded();
        if ((this._widthTracksText || this._heightTracksText) && this._textContainer.textFrame !== null){
            var width = this.bounds.size.width;
            var height = this.bounds.size.height;
            if (this._widthTracksText){
                width = this._textContainer.textFrame.size.width + this._textInsets.left + this._textInsets.right;
            }
            if (this._heightTracksText){
                height = this._textContainer.textFrame.size.height + this._textInsets.top + this._textInsets.bottom;
            }
            if (this.integerSizeRequired){
                width = Math.ceil(width);
                height = Math.ceil(height);
            }
            this.ignoreSetNeedsLayout = true;
            this.bounds = JSRect(0, 0, width, height);
            this.ignoreSetNeedsLayout = false;
        }
    },

    ignoreSetNeedsLayout: false,

    setNeedsLayout: function(){
        if (this.ignoreSetNeedsLayout){
            return;
        }
        UITextLayer.$super.setNeedsLayout.call(this);
    },

    firstBaselineOffsetFromTop: JSReadOnlyProperty(),
    lastBaselineOffsetFromBottom: JSReadOnlyProperty(),

    getFirstBaselineOffsetFromTop: function(){
        if (this._textContainer.textFrame !== null && this._textContainer.textFrame.lines.length > 0){
            var firstLine = this._textContainer.textFrame.lines[0];
            return this._textInsets.top + firstLine.origin.y + firstLine.size.height - firstLine.baseline;
        }
        return this._textInsets.top + this._textLayoutManager.defaultFont.displayAscender;
    },

    getLastBaselineOffsetFromBottom: function(){
        if (this._textContainer.textFrame !== null && this._textContainer.textFrame.lines.length > 0){
            var lastLine = this._textContainer.textFrame.lines[this._textContainer.textFrame.lines.length - 1];
            return this.bounds.size.height - (this._textInsets.top + lastLine.origin.y + lastLine.size.height - lastLine.baseline);
        }
        return this._textInsets.bottom - this._textLayoutManager.defaultFont.displayDescender;
    },

    // MARK: - Layout Manager delegate

    layoutManagerDidInvalidateLayout: function(layoutManager){
        this.setNeedsLayout();
        this.setNeedsDisplay();
    },

    layoutManagerTextContainerForLocation: function(layoutManager, location){
        return this._textContainer;
    },

    setNeedsRedisplay: function(){
        UITextLayer.$super.setNeedsRedisplay.call(this);
        this._textLayoutManager.setNeedsLayout();
    }

});

UITextLayer.Properties = Object.create(UILayer.Properties, {
    textColor: {
        writable: true,
        value: null,
    }
});

})();
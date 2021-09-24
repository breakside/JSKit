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

// #import "UIWindow.js"
// #import "UILabel.js"
'use strict';

JSClass("UITooltipWindow", UIWindow, {

    initWithString: function(str, maxSize){
        this._styler = UIWindow.Styler.tooltip;
        UITooltipWindow.$super.init.call(this);
        this.layer._domPointerEventsNone = true;
        var label = UILabel.init();
        label.font = this._styler.font;
        label.textInsets = this._styler.textInsets;
        if (str.isKindOfClass && str.isKindOfClass(JSAttributedString)){
            label.attributedText = str;
        }else{
            label.text = str;
        }
        label.maximumNumberOfLines = 0;
        label.sizeToFitSize(maxSize);
        this.contentView = UIView.init();
        this.contentView.addSubview(label);
        this.frame = JSRect(JSPoint.Zero, label.frame.size);
    },

    canBecomeKey: function(){
        return false;
    },

    canBecomeMain: function(){
        return false;
    },

    userInteractionEnabled: false,

    accessibilitySubrole: UIAccessibility.Subrole.tooltip

});

JSClass("UITooltipWindowStyler", UIWindowStyler, {

    font: null,
    textColor: null,
    textInsets: null,
    backgroundColor: null,
    borderColor: null,
    borderWidth: 0.5,
    shadowColor: null,
    shadowRadius: 15,
    cornerRadius: 0,

    init: function(){
        UITooltipWindowStyler.$super.init.call(this);
        this.backgroundColor = JSColor.tooltip;
        this.borderColor = JSColor.tooltipBorder;
        this.shadowColor = JSColor.tooltipShadow;
        this.font = JSFont.systemFontOfSize(12.0);
        this.textColor = JSColor.tooltipText;
        this.textInsets = JSInsets(4, 6);
    },

    initializeWindow: function(window){
        UITooltipWindowStyler.$super.initializeWindow.call(this, window);
        window.backgroundColor = this.backgroundColor;
        window.borderColor = this.borderColor;
        window.shadowColor = this.shadowColor;
        window.borderWidth = this.borderWidth;
        window.shadowRadius = this.shadowRadius;
        window.cornerRadius = this.cornerRadius;
    }

});
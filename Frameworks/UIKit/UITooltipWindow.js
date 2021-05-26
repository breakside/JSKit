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
        var font = JSFont.systemFontOfSize(12.0);
        var color = JSColor.initWithRGBA(0.2, 0.2, 0.2, 1.0);
        var labelInsets = JSInsets(4, 6);
        this.initWithProperties(str, font, color, labelInsets, maxSize);
    },

    initWithProperties: function(str, font, textColor, labelInsets, maxSize){
        this._styler = UIWindow.Styler.custom;
        UITooltipWindow.$super.init.call(this);
        var label = UILabel.init();
        label.font = font;
        label.textInsets = labelInsets;
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
        this.backgroundColor = JSColor.initWithRGBA(240/255, 240/255, 240/255, 1.0);
        this.borderColor = JSColor.initWithRGBA(0.7, 0.7, 0.7, 1.0);
        this.shadowColor = JSColor.initWithRGBA(0.0, 0.0, 0.0, 0.2);
        this.borderWidth = 0.5;
        this.shadowRadius = 15;
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
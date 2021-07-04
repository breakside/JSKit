// Copyright 2021 Breakside Inc.
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

// #import Foundation
"use strict";

JSClass("CHAxisStyle", JSObject, {

    init: function(){
        this.labelFont = JSFont.systemFontOfSize(JSFont.Size.normal);
        this.labelInsets = JSInsets(5, 10);
    },

    lineWidth: 1,
    lineColor: JSColor.black,

    showsLabels: true,
    labelFont: null,
    labelTextColor: JSColor.black,
    labelAngle: 0,
    labelInsets: null,
    labelPosition: 0,

    majorTickMarkStyle: 0,
    majorTickMarkLength: 5,
    majorTickMarkWidth: 1,
    majorTickMarkColor: JSColor.black,

    minorTickMarkStyle: 0,
    minorTickMarkLength: 3,
    minorTickMarkWidth: 1,
    minorTickMarkColor: JSColor.black,

    majorGridlineColor: JSColor.initWithWhite(0.67),
    majorGridlineWidth: 0,
    majorGridlineDashLengths: null,

    minorGridlineColor: JSColor.initWithWhite(0.8),
    minorGridlineWidth: 0,
    minorGridlineDashLengths: null,

    copy: function(){
        var style = this.$class.init();
        style.lineWidth = this.lineWidth;
        style.lineColor = this.lineColor;
        style.showsLabels = this.showsLabels;
        style.labelFont = this.labelFont;
        style.labelTextColor = this.labelTextColor;
        style.labelAngle = this.labelAngle;
        style.labelInsets = this.labelInsets;
        style.labelPosition = this.labelPosition;
        style.majorTickMarkStyle = this.majorTickMarkStyle;
        style.majorTickMarkLength = this.majorTickMarkLength;
        style.majorTickMarkWidth = this.majorTickMarkWidth;
        style.majorTickMarkColor = this.majorTickMarkColor;
        style.minorTickMarkStyle = this.minorTickMarkStyle;
        style.minorTickMarkLength = this.minorTickMarkLength;
        style.minorTickMarkWidth = this.minorTickMarkWidth;
        style.minorTickMarkColor = this.minorTickMarkColor;
        style.majorGridlineColor = this.majorGridlineColor;
        style.majorGridlineWidth = this.majorGridlineWidth;
        style.majorGridlineDashLengths = this.majorGridlineDashLengths;
        style.minorGridlineColor = this.minorGridlineColor;
        style.minorGridlineWidth = this.minorGridlineWidth;
        style.minorGridlineDashLengths = this.minorGridlineDashLengths;
        return style;
    }

});

CHAxisStyle.TickMarkStyle = {
    none: 0,
    inside: 1,
    outside: 2,
    centered: 3
};

CHAxisStyle.LabelPosition = {
    onTickMarks: 0,
    betweenTickMarks: 1
};
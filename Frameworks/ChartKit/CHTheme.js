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
// #import "CHSeriesStyle.js"
"use strict";

JSClass("CHTheme", JSObject, {

    initWithColors: function(colors){
        this.colors = JSCopy(colors);
        this.barStyle = CHSeriesBarStyle.initWithColor(null);
        this.barStyle.borderWidth = 1;
        this.barStyle.borderColor = JSColor.black.colorWithAlpha(0.2);
        this.barStyle.maskedBorders = CHSeriesBarStyle.Sides.end;
        this.lineStyle = CHSeriesLineStyle.initWithColor(null);
        this.lineStyle.lineWidth = 4;
        this.lineStyle.symbolPath = JSPath.init();
        this.lineStyle.symbolPath.addEllipseInRect(JSRect(-6, -6, 12, 12));
        this.lineStyle.symbolFillColor = JSColor.white;
        this.valueAxisGridlineColor = JSColor.initWithWhite(0.6);
    },

    colors: null,
    valueAxisLineWidth: 0,
    valueAxisMajorGridlineWidth: 0.5,
    valueAxisMajorGridlineColor: null,
    categoryAxisLineWidth: 1,
    barStyle: null,
    lineStyle: null,

});

Object.defineProperties(CHTheme, {
    default: {
        configurable: true,
        get: function(){
            var colors = [
                JSColor.initWithRGBAHexString("3399CC"),
                JSColor.initWithRGBAHexString("33CC80"),
                JSColor.initWithRGBAHexString("CC9933"),
                JSColor.initWithRGBAHexString("CC3333"),
                JSColor.initWithRGBAHexString("8033CC")
            ];
            var theme = CHTheme.initWithColors(colors);
            Object.defineProperty(this, "default", {value: theme});
            return theme;
        }
    }
});
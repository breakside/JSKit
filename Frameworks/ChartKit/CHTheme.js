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
// #import "CHAxisStyle.js"
// #import "CHLegendStyle.js"
"use strict";

JSClass("CHTheme", JSObject, {

    initWithColors: function(colors){
        this.colors = JSCopy(colors);
        this.legendStyle = CHLegendStyle.init();
        this.valueAxisStyle = CHAxisStyle.init();
        this.categoryAxisStyle = CHAxisStyle.init();
        this.barStyle = CHSeriesBarStyle.initWithColor(null);
        this.lineStyle = CHSeriesLineStyle.initWithColor(null);
        this.areaStyle = CHSeriesAreaStyle.initWithColor(null);
        this.wedgeStyle = CHSeriesWedgeStyle.initWithColor(null);
    },

    colors: null,
    legendStyle: null,
    valueAxisStyle: null,
    categoryAxisStyle: null,
    barStyle: null,
    lineStyle: null,
    areaStyle: null,
    wedgeStyle: null,

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
            theme.lineStyle.lineWidth = 4;
            theme.lineStyle.symbolPath = JSPath.init();
            theme.lineStyle.symbolPath.addEllipseInRect(JSRect(-6, -6, 12, 12));
            theme.lineStyle.symbolFillColor = JSColor.white;
            theme.valueAxisStyle.lineWidth = 0;
            theme.valueAxisStyle.majorGridlineWidth = 0.5;
            theme.valueAxisStyle.majorGridlineColor = JSColor.initWithWhite(0.6);
            theme.categoryAxisStyle.lineWidth = 1;
            Object.defineProperty(this, "default", {value: theme});
            return theme;
        }
    }
});
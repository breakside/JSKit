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
// #import "CHTheme.js"
"use strict";

JSClass("CHChart", JSObject, {

    init: function(){
        this.initWithTheme(CHTheme.default);
    },

    initWithTheme: function(theme){
        this.series = [];
        this.colors = JSCopy(theme.colors);
    },

    series: null,

    addSeries: function(series){
        this.series.push(series);
    },

    colorForSeriesAtIndex: function(index){
        return this.colors[index % this.colors.length];
    },

    drawInContext: function(context, size){
    }

});

CHChart.isValidNumericValue = function(value){
    if (typeof(value) !== "number"){
        return false;
    }
    if (!isFinite(value)){
        return false;
    }
    return true;
};
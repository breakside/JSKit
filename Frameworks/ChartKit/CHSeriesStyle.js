//// Copyright 2021 Breakside Inc.
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

JSClass("CHSeriesStyle", JSObject, {

    color: null,

    initWithColor: function(color){
        this.color = color;
    },

    styleWithColor: function(color){
        return this.$class.initWithColor(color);
    }

});

JSClass("CHSeriesBarStyle", CHSeriesStyle, {

    borderWidth: 0,
    borderColor: JSColor.black,
    maskedBorders: 0xF,

    styleWithColor: function(color){
        var style = CHSeriesBarStyle.$super.styleWithColor.call(this, color);
        style.borderWidth = this.borderWidth;
        style.borderColor = this.borderColor;
        style.maskedBorders = this.maskedBorders;
        return style;
    }

});

CHSeriesBarStyle.Corners = {
    none: 0,
    baseLeading: 1 << 0,
    baseTrailing: 1 << 1,
    endLeading: 1 << 2,
    endTrailing: 1 << 3,
    all: 0xF,

    pathCornersForPositiveBarCorners: function(barCorners){
        var pathCorners = 0;
        if ((barCorners & CHSeriesBarStyle.Corners.baseLeading) === CHSeriesBarStyle.Corners.baseLeading){
            pathCorners |= JSPath.Corners.minXminY;
        }
        if ((barCorners & CHSeriesBarStyle.Corners.baseTrailing) === CHSeriesBarStyle.Corners.baseTrailing){
            pathCorners |= JSPath.Corners.maxXminY;
        }
        if ((barCorners & CHSeriesBarStyle.Corners.endLeading) === CHSeriesBarStyle.Corners.endLeading){
            pathCorners |= JSPath.Corners.minXmaxY;
        }
        if ((barCorners & CHSeriesBarStyle.Corners.endTrailing) === CHSeriesBarStyle.Corners.endTrailing){
            pathCorners |= JSPath.Corners.maxXmaxY;
        }
        return pathCorners;
    },

    pathCornersForNegativeBarCorners: function(barCorners){
        var pathCorners = 0;
        if ((barCorners & CHSeriesBarStyle.Corners.baseLeading) === CHSeriesBarStyle.Corners.baseLeading){
            pathCorners |= JSPath.Corners.minXmaxY;
        }
        if ((barCorners & CHSeriesBarStyle.Corners.baseTrailing) === CHSeriesBarStyle.Corners.baseTrailing){
            pathCorners |= JSPath.Corners.maxXmaxY;
        }
        if ((barCorners & CHSeriesBarStyle.Corners.endLeading) === CHSeriesBarStyle.Corners.endLeading){
            pathCorners |= JSPath.Corners.minXminY;
        }
        if ((barCorners & CHSeriesBarStyle.Corners.endTrailing) === CHSeriesBarStyle.Corners.endTrailing){
            pathCorners |= JSPath.Corners.maxXminY;
        }
        return pathCorners;
    }
};

CHSeriesBarStyle.Corners.base = CHSeriesBarStyle.Corners.baseLeading | CHSeriesBarStyle.Corners.baseTrailing;
CHSeriesBarStyle.Corners.end = CHSeriesBarStyle.Corners.endLeading | CHSeriesBarStyle.Corners.endTrailing;
CHSeriesBarStyle.Corners.leading = CHSeriesBarStyle.Corners.baseLeading | CHSeriesBarStyle.Corners.endLeading;
CHSeriesBarStyle.Corners.trailing = CHSeriesBarStyle.Corners.baseTrailing | CHSeriesBarStyle.Corners.endTrailing;

CHSeriesBarStyle.Sides = {
    none: 0,
    leading: 1 << 0,
    trailing: 1 << 1,
    base: 1 << 2,
    end: 1 << 3,
    all: 0xF,

    pathSidesForPositiveBarSides: function(barSides){
        var pathSides = 0;
        if ((barSides & CHSeriesBarStyle.Sides.leading) === CHSeriesBarStyle.Sides.leading){
            pathSides |= JSPath.Sides.minX;
        }
        if ((barSides & CHSeriesBarStyle.Sides.trailing) === CHSeriesBarStyle.Sides.trailing){
            pathSides |= JSPath.Sides.maxX;
        }
        if ((barSides & CHSeriesBarStyle.Sides.base) === CHSeriesBarStyle.Sides.base){
            pathSides |= JSPath.Sides.minY;
        }
        if ((barSides & CHSeriesBarStyle.Sides.end) === CHSeriesBarStyle.Sides.end){
            pathSides |= JSPath.Sides.maxY;
        }
        return pathSides;
    },

    pathSidesForNegativeBarSides: function(barSides){
        var pathSides = 0;
        if ((barSides & CHSeriesBarStyle.Sides.leading) === CHSeriesBarStyle.Sides.leading){
            pathSides |= JSPath.Sides.minX;
        }
        if ((barSides & CHSeriesBarStyle.Sides.trailing) === CHSeriesBarStyle.Sides.trailing){
            pathSides |= JSPath.Sides.maxX;
        }
        if ((barSides & CHSeriesBarStyle.Sides.base) === CHSeriesBarStyle.Sides.base){
            pathSides |= JSPath.Sides.maxY;
        }
        if ((barSides & CHSeriesBarStyle.Sides.end) === CHSeriesBarStyle.Sides.end){
            pathSides |= JSPath.Sides.minY;
        }
        return pathSides;
    }
};

JSClass("CHSeriesLineStyle", CHSeriesStyle, {

    lineWidth: 4,
    lineDashLengths: null,
    lineCap: JSContext.LineCap.butt,
    symbolPath: null,
    symbolFillColor: null,
    symbolStrokeColor: null,
    symbolLineWidth: null,

    styleWithColor: function(color){
        var style = CHSeriesLineStyle.$super.styleWithColor.call(this, color);
        style.lineWidth = this.lineWidth;
        style.lineDashLengths = JSCopy(this.lineDashLengths);
        style.lineCap = this.lineCap;
        style.symbolPath = this.symbolPath;
        style.symbolFillColor = this.symbolFillColor;
        style.symbolStrokeColor = this.symbolStrokeColor;
        style.symbolLineWidth = this.symbolLineWidth;
        return style;
    }

});

JSClass("CHSeriesAreaStyle", CHSeriesLineStyle, {

    lineWidth: 0,
    lineColor: null,

    styleWithColor: function(color){
        var style = CHSeriesAreaStyle.$super.styleWithColor.call(this, color);
        style.lineColor = this.lineColor;
        return style;
    }

});
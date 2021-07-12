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

// #import "JSObject.js"
// #import "CoreTypes.js"
'use strict';

(function(){

JSClass("JSColorSpace", JSObject, {
    initWithIdentifier: function(identifier){
        switch (identifier){
            case JSColorSpace.Identifier.rgb:
                return JSColorSpace.rgb;
            case JSColorSpace.Identifier.gray:
                return JSColorSpace.gray;
        }
        return null;
    },
});

JSColorSpace.Identifier = {
    rgb: 'rgb',
    gray: 'gray'
};

JSClass("JSRGBColorSpace", JSColorSpace, {

    identifier: JSColorSpace.Identifier.rgb,
    componentNames: { 'red': 0, 'green': 1, 'blue': 2 },

    // MARK: - rgb <-> hsl

    hslFromComponents: function(rgb){
        var r = rgb[0];
        var g = rgb[1];
        var b = rgb[2];
        var max = Math.max(r, g, b);
        var min = Math.min(r, g, b);
        var d = max - min;
        var l = (max + min) / 2;
        if (d === 0){
            return [0, 0, l];
        }
        var s = d / (1 - Math.abs(2 * l - 1));
        var h;
        if (max === r){
            h = 60 * (((g - b) / d) % 6);
        }else if (max == g){
            h = 60 * (((b - r) / d) + 2);
        }else{
            h = 60 * (((r - g) / d) + 4);
        }
        if (h > 360){
            h -= 360;
        }
        if (h < 0){
            h += 360;
        }
        h /= 360;
        return [h, s, l];
    },

    componentsFromHSL: function(hsl){
        var h = hsl[0];
        var s = hsl[1];
        var l = hsl[2];
        var f = function(m1, m2, h){
            if (h < 0){
                h +=1 ;
            }else if (h > 1){
                h -= 1;
            }
            if (6 * h < 1){
                return m1 + (m2 - m1) * h * 6;
            }
            if (2 * h < 1){
                return m2;
            }
            if (3 * h < 2){
                return m1 + (m2 - m1) * (2 / 3 - h) * 6;
            }
            return m1;
        };
        var m2;
        if (l < 0.5){
            m2 = l * (s + 1);
        }else{
            m2 = l + s - l * s;
        }
        var m1 = l * 2 - m2;
        var r = f(m1, m2, h + 1 / 3);
        var g = f(m1, m2, h);
        var b = f(m1, m2, h - 1 / 3);
        return [r, g, b];
    },

    // MARK: - rgb <-> hsv

    hsvFromComponents: function(rgb){
        var hsl = this.hslFromComponents(rgb);
        return this.hsvFromHSL(hsl);
    },

    componentsFromHSV: function(hsv){
        var hsl = this.hslFromHSV(hsv);
        return this.componentsFromHSL(hsl);
    },

    // MARK: - rgb <-> hwb

    hwbFromComponents: function(rgb){
        var hsv = this.hsvFromComponents(rgb);
        return this.hwbFromHSV(hsv);
    },

    componentsFromHWB: function(hwb){
        var hsv = this.hsvFromHWB(hwb);
        return this.componentsFromHSV(hsv);
    },

    // MARK: - hsl <-> hsv

    hslFromHSV: function(hsv){
        var h = hsv[0];
        var s = hsv[1];
        var v = hsv[2];
        var l = v * (1 - s / 2);
        if (l > 0 && l < 1){
            s = (v - l) / Math.min(l, 1 - l);
        }
        return [h, s, l];
    },

    hsvFromHSL: function(hsl){
        var h = hsl[0];
        var s = hsl[1];
        var l = hsl[2];
        var v = l + s * Math.min(l, 1 - l);
        if (v === 0){
            s = 0;
        }else{
            s = 2 * (1 - l / v);
        }
        return [h, s, v];
    },

    // MARK: - hsv <-> hwb

    hwbFromHSV: function(hsv){
        return [
            hsv[0],
            (1 - hsv[1]) * hsv[2],
            (1 - hsv[2])
        ];
    },

    hsvFromHWB: function(hwb){
        return [
            hwb[0],
            1 - (hwb[1] / (1 - hwb[2])),
            1 - hwb[2]
        ];
    },

});

JSClass("JSGrayColorSpace", JSColorSpace, {

    identifier: JSColorSpace.Identifier.gray,
    componentNames: { 'white': 0 }

});

Object.defineProperties(JSColorSpace, {

    rgb: {
        configurable: true,
        get: function(){
            var space = JSRGBColorSpace.init();
            Object.defineProperty(this, "rgb", {value: space});
            return space;
        }
    },

    gray: {
        configurable: true,
        get: function(){
            var space = JSGrayColorSpace.init();
            Object.defineProperty(this, "gray", {value: space});
            return space;
        }
    }

});

})();
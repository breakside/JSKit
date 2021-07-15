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

    numberOfComponents: 0,

    rgbFromComponents: function(components){
        return JSColorSpace.rgb.componentsFromSpace(this, components);
    },

    grayFromComponents: function(components){
        return JSColorSpace.gray.componentsFromSpace(this, components);
    },

    xyzFromComponents: function(components){
    },

    componentsFromXYZ: function(xyz){
    },

    componentsFromSpace: function(space, components){
        if (space === this){
            // slice to create a copy and to always return the expected number of
            // components regardless of whether an alpha component was passed in
            return components.slice(0, this.numberOfComponents);
        }
        var xyz = space.xyzFromComponents(components);
        return this.componentsFromXYZ(xyz);
    }

});

JSClass("JSXYZColorSpace", JSColorSpace, {

    name: "xyz",

    initWithWhitepoint: function(mediaWhitepoint, connectionWhitepoint){
        if (mediaWhitepoint === connectionWhitepoint){
            return JSColorSpace.xyz;
        }
        if (mediaWhitepoint[0] === connectionWhitepoint[0] && mediaWhitepoint[1] === connectionWhitepoint[1] && mediaWhitepoint[2] === connectionWhitepoint[2]){
            return JSColorSpace.xyz;
        }
        return JSXYZScaledColorSpace.initWithWhitepoint(mediaWhitepoint, connectionWhitepoint);
    },

    initWithScale: function(scale){
        return JSXYZScaledColorSpace.initWithScale(scale);
    },

    xyzFromComponents: function(components){
        return [
            components[0],
            components[1],
            components[2]
        ];
    },

    componentsFromXYZ: function(xyz){
        return [
            xyz[0],
            xyz[1],
            xyz[2]
        ];
    },

});

JSClass("JSXYZScaledColorSpace", JSXYZColorSpace, {

    _scale: null,
    _inverseScale: null,

    initWithWhitepoint: function(mediaWhitepoint, connectionWhitepoint){
        this.initWithScale([
            mediaWhitepoint[0] / connectionWhitepoint[0],
            mediaWhitepoint[1] / connectionWhitepoint[1],
            mediaWhitepoint[2] / connectionWhitepoint[2]
        ]);
    },

    initWithScale: function(scale){
        this._scale = scale;
        this._inverseScale = [
            1 / this._scale[0],
            1 / this._scale[1],
            1 / this._scale[2]
        ];
    },

    xyzFromComponents: function(components){
        return [
            components[0] * this._scale[0],
            components[1] * this._scale[1],
            components[2] * this._scale[2]
        ];
    },

    componentsFromXYZ: function(xyz){
        return [
            xyz[0] * this._inverseScale[0],
            xyz[1] * this._inverseScale[1],
            xyz[2] * this._inverseScale[2]
        ];
    },

});

JSClass("JSLabColorSpace", JSColorSpace, {

    name: "lab",

    mediaWhitepoint: null,

    initWithWhitepoint: function(mediaWhitepoint){
        this.mediaWhitepoint = mediaWhitepoint;
    },

    xyzFromComponents: function(components){
        var fi = function(x){
            if (x > 6.0 / 29.0){
                return x * x * x;
            }
            return (x - 4.0 / 20.0) * (108.0 / 841.0);
        };
        var fy = (components[0] + 16.0) / 116.0;
        var fx = components[1] / 500.0 + fy;
        var fz = fy - components[2] / 200.0;
        return [
            this.mediaWhitepoint[0] * fi(fx),
            this.mediaWhitepoint[1] * fi(fy),
            this.mediaWhitepoint[2] * fi(fz)
        ];
    },

    componentsFromXYZ: function(xyz){
        var f = function(x){
            if (x > 216.0 / 24389.0){
                return Math.pow(x, 1.0 / 3.0);
            }
            return (841.0 / 108.0) * x + 4.0 / 29.0;
        }; 
        var fx = f(xyz[0] / this.mediaWhitepoint[0]);
        var fy = f(xyz[1] / this.mediaWhitepoint[1]);
        var fz = f(xyz[2] / this.mediaWhitepoint[2]);
        return [
            116.0 * fy - 16.0,
            500.0 * (fx - fy),
            200.0 * (fy - fz)
        ];
    },

});

JSClass("JSRGBColorSpace", JSColorSpace, {

    numberOfComponents: 3,

    name: "rgb",
    componentNames: { 'red': 0, 'green': 1, 'blue': 2 },

    rgbFromComponents: function(components){
        return [components[0], components[1], components[2]];
    },

    grayFromComponents: function(components){
        return [(components[0] + components[1] + components[2]) / 3];
    },

    // MARK: - Lab conversions

    xyzFromComponents: function(components){
    },

    componentsFromXYZ: function(xyz){
    },

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

    numberOfComponents: 1,

    name: "gray",
    componentNames: { 'white': 0 },

    rgbFromComponents: function(components){
        var white = components[0];
        return [white, white, white];
    },

    grayFromComponents: function(components){
        return [components[0]];
    },

});

JSClass("JSDerivedColorSpace", JSColorSpace, {

    initWithBaseSpace: function(baseSpace){
        this.baseSpace = baseSpace;
    },

    baseFromComponents: function(components){
    },

    componentsFromBase: function(base){
    },

    xyzFromComponents: function(components){
        var base = this.baseFromComponents(components);
        return this.baseSpace.xyzFromComponents(base);
    },

    componentsFromXYZ: function(xyz){
        var base = this.baseSpace.componentsFromXYZ(xyz);
        return this.componentsFromBase(base);
    },

    rgbFromComponents: function(components){
        var base = this.baseFromComponents(components);
        return JSColorSpace.rgb.componentsFromSpace(this.baseSpace, base);
    },

    grayFromComponents: function(components){
        var base = this.baseFromComponents(components);
        return JSColorSpace.gray.componentsFromSpace(this.baseSpace, base);
    }

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
    },

    xyz: {
        configurable: true,
        get: function(){
            var space = JSXYZColorSpace.init();
            Object.defineProperty(this, "xyz", {value: space});
            return space;
        }
    },

    lab: {
        configurable: true,
        get: function(){
            var space = JSLabColorSpace.initWithWhitepoint(JSColorSpace.Whitepoint.D50);
            Object.defineProperty(this, "lab", {value: space});
            return space;
        }
    }

});

JSColorSpace.Whitepoint = {
    D50: [0.9642, 1.0, 0.82491],
    D65: [0.9505, 1.0, 1.08883]
};

})();
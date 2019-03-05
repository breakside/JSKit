// #import "PDFKit/PDFName.js"
// #import "PDFKit/PDFStream.js"
/* global JSGlobalObject, JSColor, PDFObject, PDFName, PDFStream, PDFColorSpace */
'use strict';

(function(){

var logger = JSLog("PDFKit", "ColorSpace");

JSGlobalObject.PDFColorSpace = function(params){
    if (params instanceof PDFName){
        switch (params.toString()){
            case "DeviceGray":
                return PDFColorSpace.deviceGray;
            case "DeviceRGB":
                return PDFColorSpace.deviceRGB;
            case "DeviceCMYK":
                return PDFColorSpace.deviceCMYK;
            case "Pattern":
                logger.warn("No support for Patterns, using clear");
                // TODO: support patterns
                return new PDFColorSpacePattern();
        }
        throw new Error("Invalid color space name: %s".sprintf(params));
    }
    var family = params[0];
    switch (family.toString()){
        case "CalGray":
            return new PDFColorSpaceCIEGray(params[1]);
        case "CalRGB":
            return new PDFColorSpaceCIERGB(params[1]);
        case "CalCMYK":
            return PDFColorSpace.deviceCMYK;
        case "Lab":
            return new PDFColorSpaceCIELab(params[1]);
        case "ICCBased":
            // Will need to load stream data when implented
            // (using Alternate for now instead)
            if (params[1].Alternate){
                logger.info("Using Alernate color space for ICCBased");
                return PDFColorSpace(params[1].Alternate);
            }
            logger.info("Using device color space for ICCBased with %d components", params[1].N);
            switch (params[1].N){
                case 1:
                    return PDFColorSpace.deviceGray;
                case 3:
                    return PDFColorSpace.deviceRGB;
                case 4:
                    return PDFColorSpace.deviceCMYK;
            }
            throw new Error("Invalid ICC color space, no alternate and N != 1|3|4");
        case "Indexed":
            // Might need to load stream data (params[3] could be hex string or a stream)
            // (for now, will always return black if params[3] is a stream)
            var base = PDFColorSpace(params[1]);
            return new PDFColorSpaceIndexed(base, params[2], params[3]);
        case "Separation":
            logger.warn("No support for Separation, using alternate");
            // TOO: fullly support Separation
            // Using alternate space
            return PDFColorSpace(params[2]);
        case "DeviceN":
            logger.warn("No support for DeviceN, using black");
            // TODO: fully support DeviceN
            return new PDFColorSpaceDeviceN(params[1], params[2], params[3], params[4]);
    }
    throw new Error("Uknown color space family: %s".sprintf(family));
};

PDFColorSpace.prototype = Object.create({}, {

    numberOfComponents: {
        value: 0
    },

    colorFromComponents: {
        value: function PDFColorSpace_colorFromComponents(components){
            return JSColor.blackColor;
        }
    },

    defaultComponents: {
        value: function PDFColorSpace_defaultComponents() {
            return [0];
        }
    }
});

PDFColorSpace.deviceGray = {

    numberOfComponents: 1,

    colorFromComponents: function(components){
        return JSColor.initWithWhite(components[0]);
    },

    defaultComponents: function(){
        return [0];
    }
};

PDFColorSpace.deviceRGB = {

    numberOfComponents: 3,

    colorFromComponents: function(components){
        return JSColor.initWithRGBA(components[0], components[1], components[2]);
    },

    defaultComponents: function(){
        return [0, 0, 0];
    }
};

PDFColorSpace.deviceCMYK = {

    numberOfComponents: 4,

    colorFromComponents: function(components){
        // Using values from Generic CMYK icc profile...
        // As the ICC spec says, the basic proceystride is:
        // Matrix -> Input Tables -> CLUT -> Output Tables
        // For our Generic CMYK profile, the Matrix is the
        // identity, the Input Tables and Output Tables are
        // linear y = x, so the only important part is the
        // multi-dimensional CLUT, with 9 grid points

        var cmyk = [[], [], [], []];
        var i, l;
        var index, low;
        for (i = 0, l = cmyk.length; i < l; ++i){
            index = Math.max(0, Math.min(1, components[i] || 0)) * 8;
            low = Math.floor(index);
            cmyk[i] = [{index: low, pct: 1 - (index - low)}, {index: low + 1, pct: index - low}];
        }

        var kstride = 3;
        var ystride = kstride * 9;
        var mstride = ystride * 9;
        var cstride = mstride * 9;

        // This interpolation leads to slightly different results than
        // Mac ColorSync Utility.  Unclear what accounts for the difference,
        // but guessing my weighted averaging isn't the correct math despite
        // being close-ish to the correct answer.
        var offsets = [];
        for (var c = 0; c < 2; ++c){
            for (var m = 0; m < 2; ++m){
                for (var y = 0; y < 2; ++y){
                    for (var k = 0; k < 2; ++k){
                        offsets.push({offset: cmyk[0][c].index * cstride + cmyk[1][m].index * mstride + cmyk[2][y].index * ystride + cmyk[3][k].index * kstride, pct: cmyk[0][c].pct * cmyk[1][m].pct * cmyk[2][y].pct * cmyk[3][k].pct});
                    }
                }
            }
        }
        var L = 0;
        var a = 0;
        var b = 0;
        for (i = 0, l = offsets.length; i < l; ++i){
            if (offsets[i].offset >= CMYKToLabLookup.length) return;
            L += CMYKToLabLookup[offsets[i].offset] / 255.0 * offsets[i].pct;
            a += CMYKToLabLookup[offsets[i].offset + 1] / 255.0 * offsets[i].pct;
            b += CMYKToLabLookup[offsets[i].offset + 2] / 255.0 * offsets[i].pct;
        }

        L *= 100;
        // Mac ColorSync Utility seems to map the a and b values from
        // -128 to 128 instead of the -128 to 127 that the byte represents
        // Unclear why, but we'll go ahead and match.
        // NOTE: (mapping from -128 to 127 would involve a factor of 255 instead of 256)
        a = a * 256 - 128;
        b = b * 256 - 128;
        var lab = new PDFColorSpaceCIELab({WhitePoint: D50});
        return lab.colorFromComponents([L, a, b]);
    },

    defaultComponents: function(){
        return [0, 0, 0, 1];
    }
};

var PDFColorSpaceCIEGray = function(params){
    this.whitePoint = params.WhitePoint;
    if ('BlackPoint' in params){
        this.blackPoint = params.BlackPoint;
    }
    if ('Gamma' in params){
        this.gamma = params.Gamma;
    }
};

PDFColorSpaceCIEGray.prototype = Object.create(PDFColorSpace.prototype, {
    numberOfComponents: {
        value: 1
    },
    whitePoint: {
        writable: true,
        value: null
    },
    blackPoint: {
        writable: true,
        value: [0, 0, 0]
    },
    gamma: {
        writable: true,
        value: 1
    },
    colorFromComponents: {
        value: function PDFColorSpaceCIE_colorFromComponents(components){
            var w = components[0];
            var x = this.whitePoint[0] * Math.pow(w, this.gamma);
            var y = this.whitePoint[0] * Math.pow(w, this.gamma);
            var z = this.whitePoint[0] * Math.pow(w, this.gamma);
            return colorFromXYZ(x, y, z);
        }
    },
    defaultComponents: {
        value: function(){
            return [0];
        }
    }
});

var PDFColorSpaceCIERGB = function(params){
    this.whitePoint = params.WhitePoint;
    if ('BlackPoint' in params){
        this.blackPoint = params.BlackPoint;
    }
    if ('Gamma' in params){
        this.gamma = params.Gamma;
    }
    if ('Matrix' in params){
        this.matrix = params.Matrix;
    }
};

PDFColorSpaceCIERGB.prototype = Object.create(PDFColorSpace.prototype, {
    numberOfComponents: {
        value: 3
    },
    whitePoint: {
        writable: true,
        value: null
    },
    blackPoint: {
        writable: true,
        value: [0, 0, 0]
    },
    gamma: {
        writable: true,
        value: [1, 1, 1]
    },
    matrix: {
        writable: true,
        value: [1, 0, 0, 0, 1, 0, 0, 0, 1]
    },
    colorFromComponents: {
        value: function PDFColorSpaceCIE_colorFromComponents(components){
            var a = components[0];
            var b = components[1];
            var c = components[2];
            var a_ = Math.pow(a, this.gamma[0]);
            var b_ = Math.pow(b, this.gamma[1]);
            var c_ = Math.pow(c, this.gamma[2]);
            var x = this.matrix[0] * a_ + this.matrix[3] * b_ + this.matrix[6] * c_;
            var y = this.matrix[1] * a_ + this.matrix[4] * b_ + this.matrix[7] * c_;
            var z = this.matrix[2] * a_ + this.matrix[5] * b_ + this.matrix[8] * c_;
            return colorFromXYZ(x, y, z);
        }
    },
    defaultComponents: {
        value: function(){
            return [0, 0, 0];
        }
    }
});

var PDFColorSpaceCIELab = function(params){
    this.whitePoint = params.WhitePoint;
    if ('BlackPoint' in params){
        this.blackPoint = params.BlackPoint;
    }
    if ('Range' in params){
        this.range = params.Range;
    }
};

PDFColorSpaceCIELab.prototype = Object.create(PDFColorSpace.prototype, {
    numberOfComponents: {
        value: 3
    },
    whitePoint: {
        writable: true,
        value: null
    },
    blackPoint: {
        writable: true,
        value: [0, 0, 0]
    },
    range: {
        writable: true,
        value: [-100, 100, -100, 100]
    },
    colorFromComponents: {
        value: function PDFColorSpaceCIELab_colorFromComponents(components){
            var L = components[0];
            var a = components[1];
            var b = components[2];
            var q = (L + 16) / 116;
            var x = this.whitePoint[0] * g(q + a / 500);
            var y = this.whitePoint[1] * g(q);
            var z = this.whitePoint[2] * g(q - b / 200);
            return colorFromXYZ(x, y, z);
        }
    },
    defaultComponents: {
        value: function(){
            return [0, Math.min(Math.max(0, this.range[0]), this.range[1]), Math.min(Math.max(0, this.range[2]), this.range[3])];
        }
    }
});

var PDFColorSpaceIndexed = function(base, max, lookup){
    this.base = base;
    this.max = max;
    if (lookup instanceof PDFStream){
        logger.warn("Not fetching Indexed stream data, using black");
        // FIXME: need to get data synchronously
        this.lookup = null;
    }else{
        this.lookup = lookup;
    }
};

PDFColorSpaceIndexed.prototype = Object.create(PDFColorSpace.prototype, {
    numberOfComponents: {
        value: 1
    },
    base: {
        writable: true,
        value: null,
    },
    max: {
        writable: true,
        value: 255
    },
    lookup: {
        writable: true,
        value: null,
    },
    colorFromComponents: {
        value: function PDFColorSpaceIndexed_colorFromComponents(components){
            if (this.lookup === null){
                return JSColor.blackColor;
            }
            var index = Math.min(Math.max(0, Math.round(components[0])), this.max);
            var n = this.base.defaultComponents().length;
            var offset = n * index;
            var lookupComponents = [];
            var x;
            for (var i = 0; i < n; ++i, ++offset){
                x = this.lookup[offset];
                lookupComponents.push(x / 255.0);
            }
            return this.base.colorFromComponents(lookupComponents);
        }
    },
    defaultComponents: {
        value: function(){
            return [0, Math.min(Math.max(0, this.range[0]), this.range[1]), Math.min(Math.max(0, this.range[2]), this.range[3])];
        }
    }

});

var PDFColorSpaceDeviceN = function(names, alternate, tintTransform, attributes){
    this.numberOfComponents = names.length;
    this._defaultComponents = [];
    for (var i = 0, l = this.numberOfComponents; i < l; ++i){
        this._defaultComponents.push(1);
    }
};

PDFColorSpaceDeviceN.prototype = Object.create(PDFColorSpace.prototype, {
    _defaultComponents: {
        writable: true,
        value: null,
    },
    numberOfComponents: {
        writable: true,
        value: 0
    },
    colorFromComponents: {
        value: function PDFColorSpaceDeviceN_colorFromComponents(components){
            // TODO: support DeviceN
            return JSColor.blackColor;
        }
    },
    defaultComponents: {
        value: function(){
            return this._defaultComponents;
        }
    }

});

var PDFColorSpacePattern = function(){
};

PDFColorSpacePattern.prototype = Object.create(PDFColorSpace.prototype, {
    numberOfComponents: {
        value: 1
    },
    colorFromComponents: {
        value: function PDFColorSpacePattern_colorFromComponents(components){
            // TODO: support Pattern
            return JSColor.clearColor;
        }
    },
    defaultComponents: {
        value: function(){
            return [1];
        }
    }

});

var g = function(x){
    if (x >= 6 / 29){
        return x * x * x;
    }
    return 108 / 841 * (x - 4 / 29);
};

var colorFromXYZ = function(x, y, z){
    // to go from sRGB to XYZ, we use
    // this matrix:
    // var matrix = [
    //     [0.4360, 0.3851, 0.1431],
    //     [0.2225, 0.7169, 0.0606],
    //     [0.0139, 0.09710, 0.7139]
    // ];
    // 
    // to go the other way, we use the
    // inverse (precaculated):
    var matrix = [
        [3.13458, -1.61731, -0.491034],
        [-0.978957, 1.91622, 0.0335704],
        [0.0721194, -0.229142, 1.40575]
    ];
    var components = [
        matrix[0][0] * x + matrix[0][1] * y + matrix[0][2] * z,
        matrix[1][0] * x + matrix[1][1] * y + matrix[1][2] * z,
        matrix[2][0] * x + matrix[2][1] * y + matrix[2][2] * z
    ];
    for (var i = 0, l = components.length; i < l; ++i){
        components[i] = parametricCurve3(2.4, 1.0 / 1.055, 0.055 / 1.055, 1.0 / 12.92, 0.04045, components[i]);
    }
    components.push(1);
    return JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgba, components);
};

var parametricCurve3 = function(g, a, b, c, d, y){
    if (y >= c * d){
        return (Math.pow(y, (1.0 / g)) - b) / a;
    }
    return y / c;
};

var D50 = [0.9642, 1.0, 0.82491];

var CMYKToLabLookup = 
"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\
CoV+A4R+AIN/TYyARIuAOYqALIiAIoeAF4WACoSAA4OAAIKATIuFRIqGOImFLIeEIYaDF4SDCoOCAo\
KCAIKBS4qKQ4qKOImKK4aIIYWHF4OGCYKFAoKDAIGCRKBaPJ5eMZxhJZlkGZZnD5JqBI9uAIxzAIl5\
Q55hPJxkMZpmJZdpGpRsD5FuBY5xAIt1AIh6RJxmO5ppMJhrJZVtGZJwD49yBIx0AYp3AId7Q5lsOp\
duL5VwI5NyGZB0EI11BYt4AIh6AIZ8QpdyOpZzLpR0I5F2GY53D4x5BIl6AId8AIV+QpV3OpR4LpN5\
I5B6GI17D4t7BIh9AIZ+AIR/QpR9OZN9LpJ+Io5+GIx+D4p+BId/AIWAAISAQZOCOZKDLpGCIo2CGI\
uBD4mBBYaBAIWBAIOBQZKGOZKHLpCHIo2FGIqEEIiEBIaDAISCAIOBn1tYj15cf2FfbmRjXWdmTmpp\
O25tIXNyAnl4nVZjjlpmfl5obWFrXWRtTWdvOmxyInF1A3d5m1NsjVhufFtva19xW2JyS2Z0OWp2IH\
B4AnZ7mVB2ilR2elh3aFx4WWB5SmR6N2l7H258AnV9l01+iVJ+eFZ+Z1p+WF5+SWJ/Nmd/Hm1/AXR/\
lEqHh0+Gd1SGZliFV1yESGGDNWaCHW2BAXSAk0iPhk6OdlKNZlaLV1uJR2CINGaGHWyEAXSCkkaZhU\
yWdlGUZlWRVlqPR1+NNWWKHWuHAXSDkkWhhUuddVCaZVSXVlmUSF6RNWSOHWuKAXSFkWJYhGVcdGdf\
ZGpjVWxmRm5pNHFtHnVyA3p4j15igmJlc2RoZGdqVGpsRWxvM3BxHnR1Anl5jltqgV9scmJuYmVwU2\
dyQ2pzMW52HXJ4Anh7i1dzf1x1cF92X2J3UWV4Qml5MG16HHF7And9ilV8fVl9blx9XmB9UGN9Qmd+\
L2t+G3B+AnZ/iFKEfFeEbVqDXl6DUGKCQWaCLmqBGm+BAXWAh1CNe1WMbVmKXV2JT2CIQGWGLmqFGm\
+DAXWChk+VelSTbFeRXFuPTl+NQGSLLmmJGm6GAXWDhk6delOaa1eXW1qUTl+RQGOPLmiMGW6JAXWE\
hGlYeWtca21fW29jTHFmPnNpLHVtF3hyAnt4g2VheGhkampnW2xqTG5sPXFuK3NxGHZ0Anp5gmJpd2\
VraWhtWWpvS2xxPG9zKnJ1F3V3AXl7gF9ydWJ0ZmV1V2d2SWp3O214KXB6FnR7AHh9f1x6c2B7ZWJ7\
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\
L21wG3FzAXd4hlZmelppa11rXGFtTWRvP2dxLWx0GnB2AXZ6g1Jvd1ZxaVpyWl10TGF1PmZ3LGp4GW\
96AHV8gU94dlR5aFd5WVt6S197PWR7K2l8GG59AHR+gEyAdVGAZ1WAWFmAS16APGJ/KmiAGG2AAHR/\
f0mIdE+HZlOGWFiGSlyFPGGEKWeDF2yCAHOBfkiRc02PZVKNV1aLSluKPGCIKmaHF2yFAHOCfkaYck\
yWZVCTVlWQSVqOPV+MKmWKF2uHAHOEfmVUcmdZZGlcVmxgR25kOXBnKHNrFHZwAHl3fGBecWNhY2Zk\
VWlnR2tqOG5sJ3FvFXRzAXl4e11lcGBoYmNqVGZtRmlvN2xxJm9zFHN2AHd6eVlubl1wYGBxUWNzRG\
Z0N2p2JG54EnJ5AHZ8d1Z2bFp3X114UGF5RGR5Nmh6I217EXF8AHZ9dlN9a1h+Xlt+UF9+Q2N+NWd+\
I2x/EXB/AHV/dVGFalaFXVmET12EQ2GDNWaCImuCEW+BAHWAdE+NalSMXFiLTlyJQmCINWSGI2mGEm\
6EAHWCdE6UaVOTXFeRTVuOQV+MNWSKI2mJEW6GAHSDdGxVaG5ZWm9cTHJgP3NkMXVnIHdrEHlwAHt3\
cGddZmphWWxjTG5mP3BpMXJsH3VvD3hzAHp4b2RkZWdnWGlpSmxsPm5uMHBwHnNzD3Z2AHl5b2FtZG\
RvVmZwSGlyPGx0L251HHJ3DXV5AHh7bV50YmF1VWR2SGd3PGp4Lm15HHF6DHR8AHh9alt7YF97VGJ8\
R2V8O2h9Lmt9G3B+DHN+AHd+aVmCX12CU2CCRmSCO2eBLWqBG2+BDHOAAHeAaVeJX1uJU1+IRWKHOm\
aFLWmFG22EDXKDAHaBaVaQX1qPUl6ORGGLOWWJLWiIHG2HDXGFAHaCZ3RVXHVZT3ZcQnhgNXhkKHln\
F3trC3xwAH13ZG9cW3FgT3JjQnRmNXZpKHdrFnlvC3tzAHx4ZGxjWm5mTnBoQXJrNHNtJ3VwFndyCn\
l1AHt5Y2lrWGttTG1vP29xM3FzJnN0FXZ2CXh4AHp7YWZyV2lzS2t0Pm12Mm93JnJ4FHV6CHd7AHl9\
X2N4VmZ5Sml6Pmt7Mm57JXB8FHR9B3Z9AHl+XmF/VWSASWeAPWqAMmx/JW9/E3OACHaAAHl/XmCGVW\
OGSWaFPGiEMWuDJG6DFHGDCHWCAHiAXl6MVWKMSGWLO2eJMGqHJG2GFHCFCnSEAHiBW3tUUntYRnxc\
OX1gLX1kH35nDn9rBH9wAH93WndcUXhfRXliOXpmLXtoH3xrD31vBX5yAH54WXRiUHVlRHZoOHdqLH\
htH3pvD3tyBnx1AH15V3BpTnJsQ3NuNnVwK3ZyH3h0D3l2BHt4AHx7Vm5wTXByQnFzNXN1KnV2HnZ3\
Dnh5BHp6AHt8Vmt2TW53QW94NXF5KnN6HXV6DXd8A3l9AHt+VWl9TGx9QG19NG9+KXJ+HXR+DXZ/BH\
h/AHt/VGiDS2qDQGyDM26CKHCCHXKBDXWBBHeBAHqAU2aJS2mJP2uIMm2GKG+FHXGEDXSEBHeDAHmB\
T4JUR4JYPIJcMIJgJIJjF4JnCIJrAoJwAIF3Tn9bRn9fO39iMIBlJIBoF4BrCYBuAoFyAIB4TnthRn\
xkO31nL31qI35sF35vCX9yBH91AH95THhoRHlqOXpsLXtvIntxF3xzCX11An14AH57S3ZuQ3dwOHhx\
LHlzIXp1Fnt2CHx4Anx6AH18S3R0Q3V1N3Z2LHd4IXh4FXp5B3t7AXx8AH1+THJ6QnN7N3R7K3V8IH\
d8FXh8B3p9AXt+AH1/SnCAQnKBNnOAKnSAH3aAFXeACHmAAnqAAHyASW6FQXCGNXKFKXOEH3WDFXaD\
B3iDAXmCAHuBQ4tTPIpYMYlbJohfGYhjDodmBIZrAIVwAIN3QYhaOodeL4dhJIZkGYVnDoVqBYRuAY\
RyAIN4QYVgOYVjLoRlIoRpF4NrDoNuBYJxAoJ1AIJ5QIFmOIJpLYJrIIJtFoFwDoFyBYB1AYB3AIF7\
QH9sN4BuLIBvIIByFoBzDn91BX93AX96AIB8P31xN35zK350IH52Fn53DX54BH56AH98AH99P3t3Nn\
x4K3x5H3x6FX16DX17BH18AH59AH9/P3l9Nnp+Knt+H3t+FXx+DXx+BHx/AH1/AH+APHeCNHmCKXqC\
HnqBFXuBDXuBBHuBAHyBAH2AOJJTMpFXKY9aHo5eEYxiBotmAYlrAYhxAIZ4NpBZL49dJY5gGoxjD4\
pnB4lqAohuAYZyAIV4No1eL4xiJItkGIpoDohrBodtAoZxAYV1AIN5N4plLolnIohpFYhsDIZvB4Vx\
AoR0AIN3AIJ7NodqLYdsIYZuFYZwDIRyBoN0AoN3AIJ5AIF8NYRvLIVxIYVyFYN0DIN1BoJ3AoJ5AI\
F7AIB9M4J0K4N2IIN3FYJ4DIJ5BoF6AoB8AIB9AIB+M4B6K4F7IIJ7FYF8DIB8BoB9AoB+AH9/AICA\
Mn5/KoCAH4GAFIB/DIB/Bn+AAn+AAH+AAH+A".dataByDecodingBase64();

})();
// Copyright 2022 Breakside Inc.
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
// #import "IKMatrix.js"
'use strict';

(function(){

var logger = JSLog("imagekit", "colorprofile");

JSClass("IKColorProfile", JSColorSpace, {

    initWithData: function(data){
        if (data === null || data === undefined){
            return null;
        }
        this._data = data;
        this._dataView = data.dataView();
        try{
            this._readHeader();
            this._readTags();
        }catch (e){
            logger.warn(e);
            return null;
        }
    },

    data: JSReadOnlyProperty('_data', null),
    _dataView: null,
    numberOfComponents: 0,

    preferredCMM: 0,
    version: 0,
    profileClass: null,
    colorSpace: null,
    connectionSpace: null,
    createdDate: null,
    signature: null,
    platform: null,
    manufacturer: null,
    embedded: false,
    independent: false,
    model: null,
    renderingIntent: 0,
    creator: 0,
    id: null,

    _readHeader: function(){
        if (this._data.length < 128){
            throw new Error("Invalid profile, not enough data for header");
        }
        var data = this._data;
        var dataView = this._dataView;
        if (dataView.getUint32(0) != data.length){
            throw new Error("Invalid profile, size does not match data length");
        }
        this.preferredCMM = dataView.getUint32(4);
        this.version = dataView.getUint32(8);
        this.profileClass = String.initWithData(data.subdataInRange(JSRange(12, 4)), String.Encoding.latin1);
        this.colorSpace = String.initWithData(data.subdataInRange(JSRange(16, 4)), String.Encoding.latin1);
        this.connectionSpace = String.initWithData(data.subdataInRange(JSRange(20, 4)), String.Encoding.latin1);
        this.createdDate = JSCalendar.gregorian.dateFromComponents({
            year: dataView.getUint16(24),
            month: dataView.getUint16(26),
            day: dataView.getUint16(28),
            hour: dataView.getUint16(30),
            minute: dataView.getUint16(32),
            second: dataView.getUint16(34),
            timezone: JSTimeZone.utc
        });
        this.signature = String.initWithData(data.subdataInRange(JSRange(36, 4)), String.Encoding.latin1);
        if (this.signature !== "acsp"){
            throw new Error("Invalid profile signature: %s".sprintf(this.signature));
        }
        this.platform = String.initWithData(data.subdataInRange(JSRange(40, 4)), String.Encoding.latin1);
        var flags = dataView.getUint32(44);
        this.embedded = (flags & 0x01) === 0x01;
        this.independent = (flags & 0x02) === 0x02;
        this.manufacturer = dataView.getUint32(48);
        this.model = dataView.getUint32(52);
        // attributes1:    dataView.getUint32(56),
        // attributes2:    dataView.getUint32(60),
        this.renderingIntent = dataView.getUint32(64);
        this.connectionWhitepoint = XYZ32(dataView.getUint32(68), dataView.getUint32(72), dataView.getUint32(76));
        this.creator = dataView.getUint32(80);
        this.id = data.subdataInRange(JSRange(84, 16)).hexStringRepresentation();
        switch (this.colorSpace){
            case IKColorProfile.ColorSpace.xyz:
                this.numberOfComponents = 3;
                break;
            case IKColorProfile.ColorSpace.lab:
                this.numberOfComponents = 3;
                break;
            case IKColorProfile.ColorSpace.luv:
                this.numberOfComponents = 3;
                break;
            case IKColorProfile.ColorSpace.ycbcr:
                this.numberOfComponents = 3;
                break;
            case IKColorProfile.ColorSpace.yxy:
                this.numberOfComponents = 3;
                break;
            case IKColorProfile.ColorSpace.rgb:
                this.numberOfComponents = 3;
                break;
            case IKColorProfile.ColorSpace.gray:
                this.numberOfComponents = 1;
                break;
            case IKColorProfile.ColorSpace.hsv:
                this.numberOfComponents = 3;
                break;
            case IKColorProfile.ColorSpace.hls:
                this.numberOfComponents = 3;
                break;
            case IKColorProfile.ColorSpace.cmyk:
                this.numberOfComponents = 4;
                break;
            case IKColorProfile.ColorSpace.cmy:
                this.numberOfComponents = 3;
                break;
            case IKColorProfile.ColorSpace.twoColor:
                this.numberOfComponents = 2;
                break;
            case IKColorProfile.ColorSpace.threeColor:
                this.numberOfComponents = 3;
                break;
            case IKColorProfile.ColorSpace.fourColor:
                this.numberOfComponents = 4;
                break;
            case IKColorProfile.ColorSpace.fiveColor:
                this.numberOfComponents = 5;
                break;
            case IKColorProfile.ColorSpace.sixColor:
                this.numberOfComponents = 6;
                break;
            case IKColorProfile.ColorSpace.sevenColor:
                this.numberOfComponents = 7;
                break;
            case IKColorProfile.ColorSpace.eightColor:
                this.numberOfComponents = 8;
                break;
            case IKColorProfile.ColorSpace.nineColor:
                this.numberOfComponents = 9;
                break;
            case IKColorProfile.ColorSpace.tenColor:
                this.numberOfComponents = 10;
                break;
            case IKColorProfile.ColorSpace.elevenColor:
                this.numberOfComponents = 11;
                break;
            case IKColorProfile.ColorSpace.twelveColor:
                this.numberOfComponents = 12;
                break;
            case IKColorProfile.ColorSpace.thirteenColor:
                this.numberOfComponents = 13;
                break;
            case IKColorProfile.ColorSpace.fourteenColor:
                this.numberOfComponents = 14;
                break;
            case IKColorProfile.ColorSpace.fifteenColor:
                this.numberOfComponents = 15;
                break;
            default:
                throw new Error("Invalid color space: %s".sprintf(this.colorSpace));
        }
    },

    _tags: null,

    _readTags: function(){
        if (this._data.length < 128){
            throw new Error("Invalid profile, not enough data for tag count");
        }
        var tagCount = this._dataView.getUint32(128);
        if (this._data.length < 132 + tagCount * 12){
            throw new Error("Invalid profile, not enough data for tag table");
        }
        var offset = 132;
        this._tags = {};
        var tag;
        var name;
        for (var i = 0; i < tagCount; ++i){
            name = String.initWithData(this._data.subdataInRange(JSRange(offset, 4)), String.Encoding.latin1);
            tag = {
                name: name,
                range: JSRange(this._dataView.getUint32(offset + 4), this._dataView.getUint32(offset + 8))
            };
            if (tag.range.end > this._data.length){
                throw new Error("Invalid profile, not enough data for tag %s at %d (%d)".sprintf(tag.name, tag.range.location, tag.range.length));
            }
            this._tags[tag.name] = tag;
            offset += 12;
        }
        for (var propertyName in IKColorProfile.Tag){
            name = IKColorProfile.Tag[propertyName];
            this.definePropertyForTag(name, propertyName);
        }
    },

    definePropertyForTag: function(name, propertyName){
        Object.defineProperty(this, propertyName, {
            configurable: true,
            get: function(){
                var value = this.getTag(name);
                Object.defineProperty(this, propertyName, {value: value});
                return value;
            }
        });
    },

    getTag: function(name){
        var tag = this._tags[name];
        if (!tag){
            return null;
        }
        var data = this.data.subdataInRange(tag.range);
        var allowedTypes = IKColorProfile.allowedTypesForTag[name];
        return IKColorProfileType.initWithData(data, allowedTypes);
    },

});

IKColorProfile.ProfileClass = {
    input: "scnr",
    display: "mntr",
    output: "prtr",
    deviceLink: "link",
    colorSpace: "spac",
    abstract: "abst",
    namedColor: "nmcl"
};

IKColorProfile.ColorSpace = {
    xyz: "XYZ ",
    lab: "Lab ",
    luv: "Luv ",
    ycbcr: "YCbr",
    yxy: "Yxy ",
    rgb: "RGB ",
    gray: "GRAY",
    hsv: "HSV ",
    hls: "HLS ",
    cmyk: "CMYK",
    cmy: "CMY ",
    twoColor: "2CLR",
    threeColor: "3CLR",
    fourColor: "4CLR",
    fiveColor: "5CLR",
    sixColor: "6CLR",
    sevenColor: "7CLR",
    eightColor: "8CLR",
    nineColor: "9CLR",
    tenColor: "ACLR",
    elevenColor: "BCLR",
    twelveColor: "CCLR",
    thirteenColor: "DCLR",
    fourteenColor: "ECLR",
    fifteenColor: "FCLR"
};

IKColorProfile.Platform = {
    apple: "APPL",
    microsoft: "MSFT",
    siliconGraphics: "SGI ",
    sunMicrosystems: "SUNW"
};

IKColorProfile.RenderingIntent = {
    perceptual: 0,
    mediaRelative: 1,
    saturation: 2,
    absolute: 3
};

IKColorProfile.Tag = {
    aToB0: "A2B0",
    aToB1: "A2B1",
    aToB2: "A2B2",
    blueMatrixColumn: "bXYZ",
    blueToneReproductionCurve: "bTRC",
    bToA0: "B2A0",
    bToA1: "B2A1",
    bToA2: "B2A2",
    bToD0: "B2D0",
    bToD1: "B2D1",
    bToD2: "B2D2",
    bToD3: "B2D3",
    calibrationDate: "calt",
    charTarget: "targ",
    chromaticAdaptation: "chad",
    chromaticity: "chrm",
    colorantOrder: "clro",
    colorantTable: "clrt",
    colorantTableOut: "clot",
    colorimetricIntentImageState: "ciis",
    copyright: "cprt",
    deviceManufacturer: "dmnd",
    deviceModelDescription: "dmdd",
    dToB0: "D2B0",
    dToB1: "D2B1",
    dToB2: "D2B2",
    dToB3: "D2B3",
    gamut: "gamt",
    grayToneReproductionCurve: "kTRC",
    greenMatrixColumn: "gXYZ",
    greenToneReproductionCurve: "gTRC",
    luminance: "lumi",
    measurement: "meas",
    mediaWhitepoint: "wtpt",
    namedColor: "ncl2",
    outputResponse: "resp",
    perceptualRenderingIntentGamut: "rig0",
    preview0: "pre0",
    preview1: "pre1",
    preview2: "pre2",
    profileDescription: "desc",
    profileSequenceDescription: "pseq",
    profileSequenceIdentifier: "psid",
    redMatrixColumn: "rXYZ",
    redToneReproductionCurve: "rTRC",
    saturationRenderingIntentGamut: "rig2",
    technology: "tech",
    viewingConditionsDescription: "vued",
    viewingConditions: "view"
};

IKColorProfile.DataType = {
    chromaticity: "chrm",
    colorantOrder: "clro",
    colorantTable: "clrt",
    curve: "curv",
    data: "data",
    dateTime: "dtim",
    lookupTable8: "mft1",
    lookupTable16: "mft2",
    lookupTableAToB: "mAB ",
    lookupTableBToA: "mBA ",
    measurement: "meas",
    multiLocalizedUnicode: "mluc",
    multiProcessElements: "mpet",
    namedColor: "ncl2",
    parametricCurve: "para",
    profileSequenceDescription: "pseq",
    profileSequenceIdentifier: "psid",
    responseCurveSet16: "rcs2",
    s15Fixed16Array: "sf32",
    signature: "sig ",
    text: "text",
    u16Fixed16Array: "uf32",
    uin8Array: "ui08",
    uint16Array: "ui16",
    uint32Array: "ui32",
    uint64Array: "ui64",
    viewingConditions: "view",
    xyz: "XYZ "
};

IKColorProfile.allowedTypesForTag = {};
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.aToB0] = [IKColorProfile.DataType.lookupTable8, IKColorProfile.DataType.lookupTable16, IKColorProfile.DataType.lookupTableAToB];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.aToB1] = [IKColorProfile.DataType.lookupTable8, IKColorProfile.DataType.lookupTable16, IKColorProfile.DataType.lookupTableAToB];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.aToB2] = [IKColorProfile.DataType.lookupTable8, IKColorProfile.DataType.lookupTable16, IKColorProfile.DataType.lookupTableAToB];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.blueMatrixColumn] = [IKColorProfile.DataType.xyz];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.blueToneReproductionCurve] = [IKColorProfile.DataType.curve, IKColorProfile.DataType.parametricCurve];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.bToA0] = [IKColorProfile.DataType.lookupTable8, IKColorProfile.DataType.lookupTable16, IKColorProfile.DataType.lookupTableBToA];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.bToA1] = [IKColorProfile.DataType.lookupTable8, IKColorProfile.DataType.lookupTable16, IKColorProfile.DataType.lookupTableBToA];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.bToA2] = [IKColorProfile.DataType.lookupTable8, IKColorProfile.DataType.lookupTable16, IKColorProfile.DataType.lookupTableBToA];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.bToD0] = [IKColorProfile.DataType.multiProcessElements];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.bToD1] = [IKColorProfile.DataType.multiProcessElements];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.bToD2] = [IKColorProfile.DataType.multiProcessElements];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.bToD3] = [IKColorProfile.DataType.multiProcessElements];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.calibrationDate] = [IKColorProfile.DataType.dateTime];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.charTarget] = [IKColorProfile.DataType.text];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.chromaticAdaptation] = [IKColorProfile.DataType.s15Fixed16Array];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.chromaticity] = [IKColorProfile.DataType.chromaticity];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.colorantOrder] = [IKColorProfile.DataType.colorantOrder];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.colorantTable] = [IKColorProfile.DataType.colorantTable];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.colorantTableOut] = [IKColorProfile.DataType.colorantTable];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.colorimetricIntentImageState] = [IKColorProfile.DataType.signature];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.copyright] = [IKColorProfile.DataType.multiLocalizedUnicode];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.deviceManufacturer] = [IKColorProfile.DataType.multiLocalizedUnicode];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.deviceModelDescription] = [IKColorProfile.DataType.multiLocalizedUnicode];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.dToB0] = [IKColorProfile.DataType.multiProcessElements];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.dToB1] = [IKColorProfile.DataType.multiProcessElements];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.dToB2] = [IKColorProfile.DataType.multiProcessElements];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.dToB3] = [IKColorProfile.DataType.multiProcessElements];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.gamut] = [IKColorProfile.DataType.lookupTable8, IKColorProfile.DataType.lookupTable16, IKColorProfile.DataType.lookupTableBToA];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.grayToneReproductionCurve] = [IKColorProfile.DataType.curve, IKColorProfile.DataType.parametricCurve];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.greenMatrixColumn] = [IKColorProfile.DataType.xyz];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.greenToneReproductionCurve] = [IKColorProfile.DataType.curve, IKColorProfile.DataType.parametricCurve];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.luminance] = [IKColorProfile.DataType.xyz];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.measurement] = [IKColorProfile.DataType.measurement];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.mediaWhitepoint] = [IKColorProfile.DataType.xyz];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.namedColor] = [IKColorProfile.DataType.namedColor];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.outputResponse] = [IKColorProfile.DataType.responseCurveSet16];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.perceptualRenderingIntentGamut] = [IKColorProfile.DataType.signature];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.preview0] = [IKColorProfile.DataType.lookupTable8, IKColorProfile.DataType.lookupTable16, IKColorProfile.DataType.lookupTableAToB, IKColorProfile.DataType.lookupTableBToA];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.preview1] = [IKColorProfile.DataType.lookupTable8, IKColorProfile.DataType.lookupTable16, IKColorProfile.DataType.lookupTableBToA];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.preview2] = [IKColorProfile.DataType.lookupTable8, IKColorProfile.DataType.lookupTable16, IKColorProfile.DataType.lookupTableBToA];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.profileDescription] = [IKColorProfile.DataType.multiLocalizedUnicode];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.profileSequenceDescription] = [IKColorProfile.DataType.profileSequenceDescription];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.profileSequenceIdentifier] = [IKColorProfile.DataType.profileSequenceIdentifier];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.redMatrixColumn] = [IKColorProfile.DataType.xyz];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.redToneReproductionCurve] = [IKColorProfile.DataType.curve, IKColorProfile.DataType.parametricCurve];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.saturationRenderingIntentGamut] = [IKColorProfile.DataType.signature];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.technology] = [IKColorProfile.DataType.signature];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.viewingConditionsDescription] = [IKColorProfile.DataType.multiLocalizedUnicode];
IKColorProfile.allowedTypesForTag[IKColorProfile.Tag.viewingConditions] = [IKColorProfile.DataType.viewingConditions];

IKColorProfile.Curve = {
    identity: function(x){
        return x;
    },
    gamma: function(g){
        var fn = function(x){
            return Math.pow(x, g);
        };
        fn.inverse = function(y){
            y = Math.min(1, Math.max(0, y));
            return Math.pow(y, 1.0 / g);
        };
        return fn;
    },
    parametric1: function(g, a, b){
        var fn = function(x){
            if (x >= -b / a){
                return Math.pow(a * x + b, g);
            }
            return 0;
        };
        fn.inverse = function(y){
            y = Math.min(1, Math.max(0, y));
            if (y === 0){
                return -b / a;
            }
            return (Math.pow(y, 1.0 / g) - b) / a;
        };
        return fn;
    },
    parametric2: function(g, a, b, c){
        var fn = function(x){
            if (x >= - b / a){
                return Math.pow(a * x + b, g) + c;
            }
            return c;
        };
        fn.inverse = function(y){
            y = Math.min(1, Math.max(0, y));
            if (y === c){
                return -b / a;
            }
            return (Math.pow(y - c, 1.0 / g) - b) / a;
        };
        return fn;
    },
    parametric3: function(g, a, b, c, d){
        var fn = function(x){
            if (x >= d){
                return Math.pow(a * x + b, g);
            }
            return c * x;
        };
        fn.inverse = function(y){
            y = Math.min(1, Math.max(0, y));
            if (y < c * d){
                return y / c;
            }
            return (Math.pow(y, 1.0 / g) - b) / a;
        };
        return fn;
    },
    parametric4: function(g, a, b, c, d, e, f){
        var fn = function(x){
            if (x >= d){
                return Math.pow(a * x + b, g) + c;
            }
            return c * x + f;
        };
        fn.inverse = function(y){
            y = Math.min(1, Math.max(0, y));
            if (y < c * d + f){
                return (y - f) / c;
            }
            return (Math.pow(y - c, 1.0 / g) - b) / a;
        };
        return fn;
    },
};

IKColorProfile.Curve.identity.inverse = IKColorProfile.Curve.identity;



JSClass("IKColorProfileType", JSObject, {

    data: null,

    initWithData: function(data, allowedTypes){
        if (this.$class === IKColorProfileType){
            var type = String.initWithData(data.subdataInRange(JSRange(0, 4)), String.Encoding.latin1);
            if (allowedTypes !== undefined){
                var allowed = false;
                for (var i = 0, l = allowedTypes.length; i < l && !allowed; ++i){
                    if (type === allowedTypes[i]){
                        allowed = true;
                    }
                }
                if (!allowed){
                    return null;
                }
            }
            var subclass = IKColorProfileType.registeredSubclasses[type];
            if (subclass){
                return subclass.initWithData(data);
            }
            this.data = data;
        }else{
            this.data = data;
        }
    }

});

IKColorProfileType.registeredSubclasses = {};

IKColorProfileType.$extend = function(extensions, name){
    var subclass = JSObject.$extend.call(this, extensions, name);
    IKColorProfileType.registeredSubclasses[subclass.prototype.type] = subclass;
    return subclass;
};

JSClass("IKColorProfileCurve", IKColorProfileType, {

    type: IKColorProfile.DataType.curve,
    fn: null,

    initWithData: function(data){
        IKColorProfileCurve.$super.initWithData.call(this, data);
        var dataView = data.dataView();
        var n = dataView.getUint32(8);
        if (n === 0){
            this.fn = IKColorProfile.Curve.identity;
        }else if (n === 1){
            if (data.length < 14){
                logger.warn("not enough data for curve gamma value");
                return null;
            }
            var g = u8Fixed8(dataView.getUint16(12));
            this.fn = IKColorProfile.Curve.gamma(g);
        }else{
            var offset = 12;
            var end = offset + n + n;
            if (data.length < end){
                logger.warn("not enough data for curve values");
                return null;
            }
            var table = [];
            var sorted = true;
            for (; offset < end; offset += 2){
                table.push(dataView.getUint16(offset) / 0xFFFF);
            }
            var searcher = JSBinarySearcher(table, function(a, b){
                return a - b;
            });
            this.fn = function(x){
                var i = Math.min(1, Math.max(0, x)) * (n - 1);
                var i0 = Math.floor(i);
                var i1 = i0 + 1;
                var w0 = i1 - i;
                var w1 = 1 - w0;
                if (w1 <= 0.00001){
                    return table[i0];
                }
                return (table[i0] * w0) + (table[i1] * w1);
            };
            this.fn.inverse = function(y){
                var i0 = searcher.insertionIndexForValue(y);
                if (i0 >= n - 1){
                    return 1;
                }
                var i1 = i0 + 1;
                var y0 = table[i0];
                var y1 = table[i1];
                var w1 = (y - y0) / (y1 - y0);
                var w0 = 1 - w1;
                return (i0 * w0 + i1 * w1) / (n - 1);
            };
        }
    },

});

JSClass("IKColorProfileParametricCurve", IKColorProfileType, {

    type: IKColorProfile.DataType.parametricCurve,
    fn: null,

    initWithData: function(data){
        IKColorProfileParametricCurve.$super.initWithData.call(this, data);
        var dataView = data.dataView();
        var type = dataView.getUint16(8);
        var g, a, b, c, d, e, f;
        if (data.length < 16){
            logger.warn("not enough data for parametric curve gamma");
            return null;
        }
        g = dataView.getUint32(12) / 0xFFFFFFFF;
        if (type === 0){
            this.fn = IKColorProfile.Curve.gamma(g);
            return;
        }
        if (data.length < 24){
            logger.warn("not enough data for parametric curve 1");
            return null;
        }
        a = dataView.getUint32(16) / 0xFFFFFFFF;
        b = dataView.getUint32(20) / 0xFFFFFFFF;
        if (type === 1){
            this.fn = IKColorProfile.Curve.parametric1(g, a, b);
            return;
        }
        if (data.length < 28){
            logger.warn("not enough data for parametric curve 2");
            return null;
        }
        c = dataView.getUint32(24) / 0xFFFFFFFF;
        if (type === 2){
            this.fn = IKColorProfile.Curve.parametric2(g, a, b, c);
            return;
        }
        if (data.length < 32){
            logger.warn("not enough data for parametric curve 3");
            return null;
        }
        d = dataView.getUint32(28) / 0xFFFFFFFF;
        if (type === 3){
            this.fn = IKColorProfile.Curve.parametric3(g, a, b, c, d);
            return;
        }
        if (data.length < 40){
            logger.warn("not enough data for parametric curve 4");
            return null;
        }
        e = dataView.getUint32(32) / 0xFFFFFFFF;
        f = dataView.getUint32(36) / 0xFFFFFFFF;
        if (type === 4){
            this.fn = IKColorProfile.Curve.parametric4(g, a, b, c, d, e, f);
            return;
        }
        logger.warn("unsupported parametric curve type: %d".sprintf(type));
        return null;
    },

});

JSClass("IKColorProfileXYZ", IKColorProfileType, {

    type: IKColorProfile.DataType.xyz,
    value: null,

    initWithData: function(data){
        IKColorProfileXYZ.$super.initWithData.call(this, data);
        var dataView = data.dataView();
        if (data.length < 20){
            logger.warn("not enough data for XYZ data");
            return null;
        }
        this.value = XYZ32(
            dataView.getUint32(8),
            dataView.getUint32(12),
            dataView.getUint32(16)
        );
    },

});

JSClass("IKColorProfileLookupTable8", IKColorProfileType, {

    type: IKColorProfile.DataType.lookupTable8,
    numberOfInputChannels: 0,
    numberOfOutputChannels: 0,
    numberOfGridPoints: 0,
    matrix: null,
    inputTables: null,
    outputTables: null,
    lookupTableDataView: null,
    stride: 0,

    initWithData: function(data){
        IKColorProfileLookupTable8.$super.initWithData.call(this, data);
        var dataView = data.dataView();
        if (data.length < 48){
            logger.warn("not enough data for lut8 matrix");
            return null;
        }
        this.numberOfInputChannels = dataView.getUint8(8);
        this.numberOfOutputChannels = dataView.getUint8(9);
        this.numberOfGridPoints = dataView.getUint8(10);
        this.matrix = IKMatrix([
            [s15Fixed16(dataView.getUint32(12)), s15Fixed16(dataView.getUint32(16)), s15Fixed16(dataView.getUint32(20))],
            [s15Fixed16(dataView.getUint32(24)), s15Fixed16(dataView.getUint32(28)), s15Fixed16(dataView.getUint32(32))],
            [s15Fixed16(dataView.getUint32(36)), s15Fixed16(dataView.getUint32(40)), s15Fixed16(dataView.getUint32(44))]
        ]);
        var offset = 48;
        var end;
        var i, j, k;
        var table;
        this.stride = this.numberOfOutputChannels;
        this.inputTables = [];
        this.outputTables = [];
        for (i = 0; i < this.numberOfInputChannels; ++i){
            this.stride *= this.numberOfGridPoints;
            end = offset + 256;
            if (data.length < end){
                logger.warn("not enough data for lut8 input tables");
                return null;
            }
            table = [];
            for (; offset < end; ++offset){
                table.push(dataView.getUint8(offset) / 255.0);
            }
            this.inputTables.push(table);
        }
        end = offset + this.stride;
        if (data.length < end){
            logger.warn("not enough data for lut8 clut");
            return null;
        }
        this.lookupTableDataView = this.data.subdataInRange(JSRange(offset, this.stride)).dataView();
        offset += this.stride;
        for (i = 0; i < this.numberOfOutputChannels; ++i){
            end = offset + 256;
            if (data.length < end){
                logger.warn("not enough data for lut8 output tables");
                return null;
            }
            table = [];
            for (; offset < end; ++offset){
                table.push(dataView.getUint8(offset) / 255.0);
            }
            this.outputTables.push(table);
        }
    },

    lookup: function(components){
        var input = [];
        var i, j, l;
        var x, x0, x1;
        var offsetCount;
        var offsets = [0];
        var weights = [1];
        var w0, w1;
        var stride = this.stride;
        var d;
        for (i = 0; i < this.numberOfInputChannels; ++i){
            stride /= this.numberOfGridPoints;
            x = this.inputTables[i][Math.round(Math.max(0, Math.min(1, components[i])) * 255)];
            x *= (this.numberOfGridPoints - 1);
            x0 = Math.floor(x);
            d = x0 * stride;
            for (j = 0, l = offsets.length; j < l; ++j){
                offsets[j] += d;
            }
            if (x > x0){
                x1 = x0 + 1;
                w1 = (x - x0);
                w0 = 1 - w1;
                for (j = 0, l = offsets.length; j < l; ++j){
                    offsets.push(offsets[j] + stride);
                    weights.push(weights[j] * w1);
                    weights[j] *= w0;
                }
            }
        }
        var output = [];
        for (i = 0; i < this.numberOfOutputChannels; ++i){
            output.push(0);
        }
        var offset;
        for (i = 0, l = offsets.length; i < l; ++i){
            offset = offsets[i];
            for (j = 0; j < this.numberOfOutputChannels; ++j, ++offset){
                output[j] += this.outputTables[j][this.lookupTableDataView.getUint8(offset)] * weights[i];
            }
        }
        return output;
    }

});

JSClass("IKColorProfileLookupTable16", IKColorProfileType, {

    type: IKColorProfile.DataType.lookupTable16,
    numberOfInputTableEntries: 0,
    mumberOfOutputTableEntries: 0,
    numberOfInputChannels: 0,
    numberOfOutputChannels: 0,
    numberOfGridPoints: 0,
    matrix: null,
    inputTables: null,
    outputTables: null,
    lookupTableDataView: null,
    stride: 0,

    initWithData: function(data){
        IKColorProfileLookupTable16.$super.initWithData.call(this, data);
        var dataView = data.dataView();
        if (data.length < 48){
            logger.warn("not enough data for lut8 matrix");
            return null;
        }
        this.numberOfInputChannels = dataView.getUint8(8);
        this.numberOfOutputChannels = dataView.getUint8(9);
        this.numberOfGridPoints = dataView.getUint8(10);
        this.matrix = IKMatrix([
            [s15Fixed16(dataView.getUint32(12)), s15Fixed16(dataView.getUint32(16)), s15Fixed16(dataView.getUint32(20))],
            [s15Fixed16(dataView.getUint32(24)), s15Fixed16(dataView.getUint32(28)), s15Fixed16(dataView.getUint32(32))],
            [s15Fixed16(dataView.getUint32(36)), s15Fixed16(dataView.getUint32(40)), s15Fixed16(dataView.getUint32(44))]
        ]);
        this.numberOfInputTableEntries = dataView.getUint16(48);
        this.numberOfOutputTableEntries = dataView.getUint16(50);
        var offset = 52;
        var end;
        var i, j, k;
        var table;
        this.stride = this.numberOfOutputChannels + this.numberOfOutputChannels;
        this.inputTables = [];
        this.outputTables = [];
        for (i = 0; i < this.numberOfInputChannels; ++i){
            this.stride *= this.numberOfGridPoints;
            end = offset + this.numberOfInputTableEntries + this.numberOfInputTableEntries;
            if (data.length < end){
                logger.warn("not enough data for lut16 input tables");
                return null;
            }
            table = [];
            for (; offset < end; offset += 2){
                table.push(dataView.getUint16(offset) / 65535.0);
            }
            this.inputTables.push(table);
        }
        end = offset + this.stride;
        if (data.length < end){
            logger.warn("not enough data for lut8 clut");
            return null;
        }
        this.lookupTableDataView = this.data.subdataInRange(JSRange(offset, this.stride)).dataView();
        offset += this.stride;
        for (i = 0; i < this.numberOfOutputChannels; ++i){
            end = offset + this.numberOfOutputTableEntries + this.numberOfOutputTableEntries;
            if (data.length < end){
                logger.warn("not enough data for lut8 output tables");
                return null;
            }
            table = [];
            for (; offset < end; offset += 2){
                table.push(dataView.getUint16(offset) / 65535.0);
            }
            this.outputTables.push(table);
        }
    },

    lookup: function(components){
        var input = [];
        var i, j, l;
        var x, x0, x1;
        var offsetCount;
        var offsets = [0];
        var weights = [1];
        var w0, w1;
        var stride = this.stride;
        var d;
        for (i = 0; i < this.numberOfInputChannels; ++i){
            stride /= this.numberOfGridPoints;
            x = this.inputTables[i][Math.round(Math.max(0, Math.min(1, components[i])) * (this.numberOfInputTableEntries - 1))];
            x *= (this.numberOfGridPoints - 1);
            x0 = Math.floor(x);
            d = x0 * stride;
            for (j = 0, l = offsets.length; j < l; ++j){
                offsets[j] += d;
            }
            if (x > x0){
                x1 = x0 + 1;
                w1 = (x - x0);
                w0 = 1 - w1;
                for (j = 0, l = offsets.length; j < l; ++j){
                    offsets.push(offsets[j] + stride);
                    weights.push(weights[j] * w1);
                    weights[j] *= w0;
                }
            }
        }
        var output = [];
        for (i = 0; i < this.numberOfOutputChannels; ++i){
            output.push(0);
        }
        var offset;
        for (i = 0, l = offsets.length; i < l; ++i){
            offset = offsets[i];
            for (j = 0; j < this.numberOfOutputChannels; ++j, offset += 2){
                x = (this.lookupTableDataView.getUint16(offset) / 65535.0) * (this.numberOfOutputTableEntries - 1);
                x0 = Math.floor(x);
                if (x0 < x){
                    x1 = x0 + 1;
                    w1 = (x - x0);
                    w0 = 1 - w1;
                    output[j] += (this.outputTables[j][x0] * w0 + this.outputTables[j][x1] * w1) * weights[i];
                }else{
                    output[j] += this.outputTables[j][x0] * weights[i];
                }
            }
        }
        return output;
    }

});

// JSClass("IKColorProfileLookupTableAToB", IKColorProfileType, {

//     type: IKColorProfile.DataType.lookupTableAToB,

//     initWithData: function(data){
//         IKColorProfileLookupTableAToB.$super.initWithData.call(this, data);
//         var dataView = data.dataView();
//         // TODO:
//     },

//     lookup: function(components){
//     }

// });

// JSClass("IKColorProfileLookupTableBToA", IKColorProfileType, {

//     type: IKColorProfile.DataType.lookupTableBToA,

//     initWithData: function(data){
//         IKColorProfileLookupTableBToA.$super.initWithData.call(this, data);
//         var dataView = data.dataView();
//         // TODO:
//     },

//     lookup: function(components){
//     }

// });

JSClass("IKColorProfileComponentConverter", JSObject, {

    connectionComponentsFromComponents: function(components){
        throw new Error("unsupported component conversion");
    },

    componentsFromConnectionComponents: function(connectionComponents){
        throw new Error("unsupported component conversion");
    },

});

JSClass("IKColorProfileCurveComponentConverter", IKColorProfileComponentConverter, {

    curve: null,

    initWithCurve: function(curve){
        this.curve = curve;
    },

    connectionComponentsFromComponents: function(components){
        var white = this.curve(components[0]);
        return [
            white * JSColorSpace.Whitepoint.profileConnection[0],
            white * JSColorSpace.Whitepoint.profileConnection[1],
            white * JSColorSpace.Whitepoint.profileConnection[2]
        ];
    },

    componentsFromConnectionComponents: function(xyz){
        var white = Math.min(JSColorSpace.Whitepoint.profileConnection[1], Math.max(0, xyz[1])) / JSColorSpace.Whitepoint.profileConnection[1];
        return [this.curve.inverse(white)];
    },

});

JSClass("IKColorProfileMatrixComponentConverter", IKColorProfileComponentConverter, {

    matrix: null,
    inverseMatrix: null,
    curves: null,

    initWithMatrix: function(matrix, curves){
        this.matrix = IKMatrix(matrix);
        this.curves = curves;
        this.inverseMatrix = matrix.inverse();
    },

    connectionComponentsFromComponents: function(components){
        var rgb = [
            this.curves[0](components[0]),
            this.curves[1](components[1]),
            this.curves[2](components[2])
        ];
        return [
            this.matrix[0][0] * rgb[0] + this.matrix[0][1] * rgb[1] + this.matrix[0][2] * rgb[2],
            this.matrix[1][0] * rgb[0] + this.matrix[1][1] * rgb[1] + this.matrix[1][2] * rgb[2],
            this.matrix[2][0] * rgb[0] + this.matrix[2][1] * rgb[1] + this.matrix[2][2] * rgb[2]
        ];
    },

    componentsFromConnectionComponents: function(xyz){
        return [
            this.curves[0].inverse(this.inverseMatrix[0][0] * xyz[0] + this.inverseMatrix[0][1] * xyz[1] + this.inverseMatrix[0][2] * xyz[2]),
            this.curves[1].inverse(this.inverseMatrix[1][0] * xyz[0] + this.inverseMatrix[1][1] * xyz[1] + this.inverseMatrix[1][2] * xyz[2]),
            this.curves[2].inverse(this.inverseMatrix[2][0] * xyz[0] + this.inverseMatrix[2][1] * xyz[1] + this.inverseMatrix[2][2] * xyz[2])
        ];
    },

});

JSClass("IKColorProfileLookupComponentConverter", IKColorProfileComponentConverter, {

    lookupTable: null,
    inverseLookupTable: null,
    connectionSpace: null,

    initWithLookupTables: function(lookupTable, inverseLookupTable, connectionSpace){
        this.lookupTable = lookupTable;
        this.inverseLookupTable = inverseLookupTable;
        this.connectionSpace = connectionSpace;
    },

    connectionComponentsFromComponents: function(components){
        var connectionComponents = this.lookupTable.lookup(components);
        if (this.connectionSpace === IKColorProfile.ColorSpace.lab){
            connectionComponents = [
                connectionComponents[0] * 100.0,
                connectionComponents[1] * 256 - 128,
                connectionComponents[2] * 256 - 128
            ];
        }
        return connectionComponents;
    },

    componentsFromConnectionComponents: function(connectionComponents){
        if (this.connectionSpace === IKColorProfile.ColorSpace.lab){
            connectionComponents = [
                connectionComponents[0] / 100.0,
                (connectionComponents[1] + 128)  / 256.0,
                (connectionComponents[2] + 128)  / 256.0
            ];
        }
        return this.inverseLookupTable.lookup(connectionComponents);
    },

});

var s15Fixed16 = function(i){
    var f = ((i & 0x7FFF0000) >> 16) + ((i & 0xFFFF) / 65536.0);
    if ((i & 0x80000000) != 0){
        return -f;
    }
    return f;
};

var u8Fixed8 = function(i){
    return (i >> 8) + ((i & 0xFF) / 256.0);
};

var XYZ32 = function(x, y, z){
    if (x == 0x0000F6D6 && y == 0x00010000 && z == 0x0000D32D){
        return JSColorSpace.Whitepoint.D50;
    }
    return [
        s15Fixed16(x),
        s15Fixed16(y),
        s15Fixed16(z)
    ];
};

})();
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

// #import Foundation
'use strict';

(function(){

var logger = JSLog("imagekit", "colorprofile");

JSClass("IKColorProfile", JSColorSpace, {

    initWithProfileData: function(data){
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
            second: dataView.getUint16(34)
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
        for (var i = 0; i < tagCount; ++i){
            tag = {
                name: String.initWithData(this._data.subdataInRange(JSRange(offset, 4)), String.Encoding.latin1),
                range: JSRange(this._dataView.getUint32(offset + 4), this._dataView.getUint32(offset + 8))
            };
            if (tag.range.end > this._data.length){
                throw new Error("Invalid profile, not enough data for tag %s at %d (%d)".sprintf(tag.name, tag.range.location, tag.range.length));
            }
            this._tags[tag.name] = tag;
            offset += 12;
        }
    },

    mediaWhitepoint: JSLazyInitProperty(function(){
        return this.getTag("wtpt", [IKColorProfile.DataType.xyz]);
    }),

    redTRC: JSLazyInitProperty(function(){
        return this.getTag("rTRC", [IKColorProfile.DataType.curve, IKColorProfile.DataType.parametricCurve]);
    }),

    greenTRC: JSLazyInitProperty(function(){
        return this.getTag("gTRC", [IKColorProfile.DataType.curve, IKColorProfile.DataType.parametricCurve]);
    }),

    blueTRC: JSLazyInitProperty(function(){
        return this.getTag("bTRC", [IKColorProfile.DataType.curve, IKColorProfile.DataType.parametricCurve]);
    }),

    redXYZ: JSLazyInitProperty(function(){
        return this.getTag("rXYZ", [IKColorProfile.DataType.xyz]);
    }),

    greenXYZ: JSLazyInitProperty(function(){
        return this.getTag("gXYZ", [IKColorProfile.DataType.xyz]);
    }),

    blueXYZ: JSLazyInitProperty(function(){
        return this.getTag("bXYZ", [IKColorProfile.DataType.xyz]);
    }),

    A2B0: JSLazyInitProperty(function(){
        return this.getTag("A2B0", [IKColorProfile.DataType.lookupTable8, IKColorProfile.DataType.lookupTable16, IKColorProfile.DataType.lookupTableAToB]);
    }),

    B2A0: JSLazyInitProperty(function(){
        return this.getTag("B2A0", [IKColorProfile.DataType.lookupTable8, IKColorProfile.DataType.lookupTable16, IKColorProfile.DataType.lookupTableBToA]);
    }),

    getTag: function(name, allowedTypes){
        var tag = this._tags[name];
        if (!tag){
            return null;
        }
        var data = this.data.subdataInRange(tag.range);
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
    rgb: "RGB",
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

IKColorProfile.DataType = {
    curve: "curv",
    lookupTable8: "mft1",
    lookupTable16: "mft2",
    lookupTableAToB: "mAB ",
    lookupTableBToA: "mBA ",
    parametricCurve: "para",
    xyz: "XYZ "
};

IKColorProfile.Curve = {
    identity: function(x){
        return x;
    },
    gamma: function(g){
        var fn = function(x){
            return Math.pow(x, g);
        };
        fn.inverse = function(y){
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

    initWithData: function(data, allowedTypes){
        var type = String.initWithData(data.subdataInRange(JSRange(0, 4)), String.Encoding.latin1);
        if (allowedTypes){
            var allowed = false;
            for (var i = 0, l = allowedTypes.length; i < l && !allowed; ++i){
                if (type == allowedTypes){
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
    }

});

IKColorProfileType.registeredSubclasses = {};

IKColorProfile.$extend = function(extensions, name){
    var subclass = JSObject.$extend.call(this, extensions, name);
    IKColorProfileType.registeredSubclasses[subclass.prototype.type] = subclass;
    return subclass;
};

JSClass("IKColorProfileCurve", IKColorProfileType, {

    type: IKColorProfile.DataType.curve,
    fn: null,

    initWithData: function(data){
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
            if (data.length < 12 + n + n){
                logger.warn("not enough data for curve values");
                return null;
            }
            // TODO: interpolated
        }
    },

});

JSClass("IKColorProfileParametricCurve", IKColorProfileType, {

    type: IKColorProfile.DataType.parametricCurve,
    fn: null,

    initWithData: function(data){
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
    xyz: null,

    initWithData: function(data){
        var dataView = data.dataView();
        if (data.length < 20){
            logger.warn("not enough data for XYZ data");
            return null;
        }
        this.xyz = XYZ32(
            dataView.getUint32(8),
            dataView.getUint32(12),
            dataView.getUint32(16)
        );
    },

});

JSClass("IKColorProfileLookupTable8", IKColorProfileType, {

    type: IKColorProfile.DataType.lookupTable8,
    fn: null,

    initWithData: function(data){
        var dataView = data.dataView();
        // TODO:
    },

});

JSClass("IKColorProfileLookupTable16", IKColorProfileType, {

    type: IKColorProfile.DataType.lookupTable16,
    fn: null,

    initWithData: function(data){
        var dataView = data.dataView();
        // TODO:
    },

});

JSClass("IKColorProfileLookupTableAToB", IKColorProfileType, {

    type: IKColorProfile.DataType.lookupTableAToB,
    fn: null,

    initWithData: function(data){
        var dataView = data.dataView();
        // TODO:
    },

});

JSClass("IKColorProfileLookupTableBToA", IKColorProfileType, {

    type: IKColorProfile.DataType.lookupTableBToA,
    fn: null,

    initWithData: function(data){
        var dataView = data.dataView();
        // TODO:
    },

});

JSClass("IKColorProfileComponentConverter", JSObject, {

    connectionComponentsFromComponents: function(components){
        throw new Error("unsupported component conversion");
    },

    componentsFromConnectionComponents: function(connectionComponents){
        throw new Error("unsupported component conversion");
    },

});

JSClass("IKColorProfileMatrixComponentConverter", IKColorProfileComponentConverter, {

    matrix: null,
    inverseMatrix: null,
    curves: null,

    initWithMatrix: function(matrix, curves){
        this.matrix = matrix;
        this.curves = curves;
        this.inverseMatrix = matrixInverse(matrix);
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

    initWithLookupTables: function(lookupTable, inverseLookupTable){
        this.lookupTable = lookupTable;
        this.inverseLookupTable = inverseLookupTable;
    },

    connectionComponentsFromComponents: function(components){
        return this.lookupTable.lookup(components);
    },

    componentsFromConnectionComponents: function(xyz){
        return this.inverseLookupTable.lookup(xyz);
    },

});

var s15Fixed16 = function(i){
    var f = ((i & 0x7FFF0000) >> 16) + ((i & 0xFFFF) / 65536.0);
    if (i & (0x80000000) != 0){
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

var matrixDeterminant = function(m){
    if (m.length === 2){
        return m[0][0] * m[1][1] - m[0][1] * m[1][0];
    }
    if (m.length === 3){
        return m[0][0] * m[1][1] * m[2][2] -
            m[0][0] * m[1][2] * m[2][1] -
            m[0][1] * m[1][0] * m[2][2] +
            m[0][1] * m[1][2] * m[2][0] +
            m[0][2] * m[1][0] * m[2][1] -
            m[0][2] * m[1][1] * m[2][0];
    }
    throw new Error("cannot take determinant of matrix");
};

var matrixInverse = function(m){
    if (m.length === 2){
        return matrixMultiply([
            [m[1][1], -m[0][1]],
            [-m[1][0], m[0][0]]
        ], 1.0 / matrixDeterminant(m));
    }
    if (m.length === 3){
        return matrixMultiply([
            [
                matrixDeterminant([
                    (m[1][1], m[1][2]),
                    (m[2][1], m[2][2])
                ]),
                matrixDeterminant([
                    (m[0][2], m[0][1]),
                    (m[2][2], m[2][1])
                ]),
                matrixDeterminant([
                    (m[0][1], m[0][2]),
                    (m[1][1], m[1][2])
                ])
            ],
            [
                matrixDeterminant([
                    (m[1][2], m[1][0]),
                    (m[2][2], m[2][0])
                ]),
                matrixDeterminant([
                    (m[0][0], m[0][2]),
                    (m[2][0], m[2][2])
                ]),
                matrixDeterminant([
                    (m[0][2], m[0][0]),
                    (m[1][2], m[1][0])
                ])
            ],
            [
                matrixDeterminant([
                    (m[1][0], m[1][1]),
                    (m[2][0], m[2][1])
                ]),
                matrixDeterminant([
                    (m[0][1], m[0][0]),
                    (m[2][1], m[2][0])
                ]),
                matrixDeterminant([
                    (m[0][0], m[0][1]),
                    (m[1][0], m[1][1])
                ])
            ]
        ], 1.0 / matrixDeterminant(m));
    }
    throw new Error("cannot take determinant of matrix");
};

var matrixMultiply = function(m, x){
    if (m.length == 2){
        return [
            [m[0][0] * x, m[0][1] * x],
            [m[1][0] * x, m[1][1] * x]
        ];
    }
    if (m.length === 3){
        return [
            [m[0][0] * x, m[0][1] * x, m[0][2]],
            [m[1][0] * x, m[1][1] * x, m[1][2]],
            [m[2][0] * x, m[2][1] * x, m[2][2]]
        ];
    }
    throw new Error("cannot multiply matrix");
};

})();
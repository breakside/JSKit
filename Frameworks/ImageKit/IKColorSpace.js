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

var logger = JSLog("imagekit", "colorspace");

JSClass("IKColorSpace", JSColorSpace, {

    initWithProfileData: function(data){
        this._data = data;
        this._dataView = data.dataView();
        try{
            this._readHeader();
            this._readTags();
            this._createConnectionSpace();
        }catch (e){
            logger.error(e);
            return null;
        }
    },

    data: JSReadOnlyProperty('_data', null),
    _dataView: null,

    preferredCMM: 0,
    version: 0,
    profileClass: null,
    type: null,
    connectionType: null,
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
        this.type = String.initWithData(data.subdataInRange(JSRange(16, 4)), String.Encoding.latin1);
        this.connectionType = String.initWithData(data.subdataInRange(JSRange(20, 4)), String.Encoding.latin1);
        this.createdDate = JSCalendar.gregorian.dateFromComponents({
            year: dataView.getUint16(24),
            month: dataView.getUint16(26),
            day: dataView.getUint16(28),
            hour: dataView.getUint16(30),
            minute: dataView.getUint16(32),
            second: dataView.getUint16(34)
        });
        this.signature = String.initWithData(data.subdataInRange(JSRange(36, 4)), String.Encoding.latin1);
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
            this._tags[tag.name.trim()] = tag;
            offset += 12;
        }
    },

    connectionSpace: null,
    connectionWhitepoint: null,

    _createConnectionSpace: function(){
        if (this._header.connectionType == IKColorSpace.Type.lab){
            this.connectionSpace = JSLabColorSpace.initWithWhitepoint(this.mediaWhitepoint);
        }else if (this._header.connectionType == IKColorSpace.Type.xyz){
            this.connectionSpace = JSXYZColorSpace.initWithWhitepoint(this.mediaWhitepoint, JSColorSpace.Whitepoint.D50);
        }else{
            throw new Error("Invalid profile, connection space must be Lab or XYZ");
        }
    },

    xyzFromComponents: function(components){
        var connectionComponents = this.connectionComponentsFromComponents(components);
        return this.connectionSpace.xyzFromComponents(connectionComponents);
    },

    componentsFromXYZ: function(xyz){
        var connectionComponents = this.connectionSpace.componentsFromXYZ(xyz);
        return this.componentsFromConnectionComponents(connectionComponents);
    },

    connectionComponentsFromComponents: function(components){
        // TODO:
    },

    componentsFromConnectionComponents: function(connectionComponents){
        // TODO:
    },

    mediaWhitepoint: JSLazyInitProperty("_readMediaWhitepoint"),

    _readMediaWhitepoint: function(){
        var tag = this.tags.wtpt;
        if (!tag){
            throw new Error("wtpt tag not found");
        }
        return XYZ32(
            this._dataView.getUint32(tag.offset + 8),
            this._dataView.getUint32(tag.offset + 12),
            this._dataView.getUint32(tag.offset + 16)
        );
    }

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

IKColorSpace.ProfileClass = {
    input: "scnr",
    display: "mntr",
    output: "prtr",
    deviceLink: "link",
    colorSpace: "spac",
    abstract: "abst",
    namedColor: "nmcl"
};

IKColorSpace.Type = {
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

IKColorSpace.Platform = {
    apple: "APPL",
    microsoft: "MSFT",
    siliconGraphics: "SGI ",
    sunMicrosystems: "SUNW"
};

IKColorSpace.RenderingIntent = {
    perceptual: 0,
    mediaRelative: 1,
    saturation: 2,
    absolute: 3
};

})();
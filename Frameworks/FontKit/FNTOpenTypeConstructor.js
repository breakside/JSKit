// #import "Foundation/Foundation.js"
/* global JSClass, JSObject, JSData */
/* global FNTOpenTypeConstructorTable, FNTOpenTypeConstructorTableHead, FNTOpenTypeConstructorTableHhea, FNTOpenTypeConstructorTableHmtx, FNTOpenTypeConstructorTableName, FNTOpenTypeConstructorTableMaxp, FNTOpenTypeConstructorTablePost, FNTOpenTypeConstructorTableOS2, FNTOpenTypeConstructorTableCmap */
'use strict';

(function(){

JSClass("FNTOpenTypeConstructor", JSObject, {

    _tables: null,
    version: 0x4F54544F,
    head: null,

    init: function(){
        // head  Font header
        this.head = FNTOpenTypeConstructorTableHead.init();
        // hhea  Horizontal header
        this.hhea = FNTOpenTypeConstructorTableHhea.init();
        // hmtx  Horizontal metrics (variable size)
        this.hmtx = FNTOpenTypeConstructorTableHmtx.init();
        // name  Naming table (variable size)
        this.name = FNTOpenTypeConstructorTableName.init();
        // maxp  Maximum profile (fixed size)
        this.maxp = FNTOpenTypeConstructorTableMaxp.init();
        // OS/2  OS/2 and Windows specific metrics (fixed size)
        this.OS2 = FNTOpenTypeConstructorTableOS2.init();
        // post  PostScript information (fixed size)
        this.post = FNTOpenTypeConstructorTablePost.init();
        // cmap  Character to glyph mapping (variable size)
        this.cmap = FNTOpenTypeConstructorTableCmap.init();

        var constructor = this;
        this._tables = [
            {name: 'head', data: this.head.data},
            {name: 'hhea', data: this.hhea.data},
            Object.create({}, {
                name: {value: 'hmtx'},
                data: {get: function(){ return constructor.hmtx.data; }}
            }),
            Object.create({}, {
                name: {value: 'name'},
                data: {get: function(){ return constructor.name.data; }}
            }),
            {name: 'maxp', data: this.maxp.data},
            {name: 'OS/2', data: this.OS2.data},
            {name: 'post', data: this.post.data},
            Object.create({}, {
                name: {value: 'cmap'},
                data: {get: function(){ return constructor.cmap.data; }}
            }),
        ];
    },

    addTable: function(name, data){
        this._tables.push({name: name, data: data});
    },

    getData: function(completion, target){
        var i, l;

        l = this._tables.length;
        i = 1;
        var power = 0;
        while (i <= this._tables.length){
            i *= 2;
            power += 1;
        }
        power -= 1;
        i /= 2;

        var chunks = [];
        var offsetTable = JSData.initWithLength(12);
        var offsetTableView = offsetTable.dataView();
        offsetTableView.setUint32(0, this.version);
        offsetTableView.setUint16(4, this._tables.length);
        offsetTableView.setUint16(6, i * 16);
        offsetTableView.setUint16(8, power);
        offsetTableView.setUint16(10, this._tables.length * 16 - i * 16);
        chunks.push(offsetTable);

        var tableRecord = JSData.initWithLength(16 * this._tables.length);
        var tableRecordView = tableRecord.dataView();
        var offset;
        var tableOffset = offsetTable.length + tableRecord.length;
        var table;
        var align;
        var zeros;
        for (i = 0, l = this._tables.length; i < l; ++i, offset += 16){
            table = this._tables[i];
            tableRecordView.setUint8(offset, table.tag.charCodeAt(0));
            tableRecordView.setUint8(offset + 1, table.tag.charCodeAt(1));
            tableRecordView.setUint8(offset + 2, table.tag.charCodeAt(2));
            tableRecordView.setUint8(offset + 3, table.tag.charCodeAt(3));
            tableRecordView.setUint32(4, 0); // TODO: checksum
            tableRecordView.setUint32(8, tableOffset);
            tableRecordView.setUint32(12, table.data.length);
            chunks.push(table.data);
            tableOffset += table.data.length;
            align = tableOffset % 4;
            if (align !== 0){
                zeros = JSData.initWithLength(4 - align);
                zeros.zero();
                tableOffset += zeros.length;
                chunks.push(zeros);
            }
        }

        var fileChecksum = 0;
        // TODO calculate file checksum
        this.head.setFileChecksum(fileChecksum);

        var data = JSData.initWithChunks(chunks);
        completion.call(target, data);
    },

    setLineHeight: function(ascender, descender){
        this.hhea.setLineHeight(ascender, descender);
        this.OS2.setLineHeight(ascender, descender);
    }

});

JSClass("FNTOpenTypeConstructorTable", JSObject, {

    data: null,

});

JSClass("FNTOpenTypeConstructorTableHead", FNTOpenTypeConstructorTable, {

    init: function(){
        this.data = JSData.initWithLength(54);
        this.dataView = this.data.dataView();
        this.dataView.setUint16(0, 1); // major version (set to 1)
        this.dataView.setUint16(2, 0); // minor version (set to 0)
        this.dataView.setUint16(4, 0); // font revision (major) (manufacturer defined)
        this.dataView.setUint16(6, 0); // font revision (minor)
        this.dataView.setUint32(8, 0); // checksum adjustment (handled internally)
        this.dataView.setUint32(12, 0x5F0F3CF5); // magic number
        this.dataView.setUint16(16, 0); // flags
        this.dataView.setUint16(18, 2048); // uintsPerEM
        this.dataView.setUint32(20, 0); // created (high)
        this.dataView.setUint32(24, 0); // created (low)
        this.dataView.setUint32(28, 0); // modified (high)
        this.dataView.setUnt32(32, 0); // modified (low)
        this.dataView.setInt16(36, 0); // xMin
        this.dataView.setInt16(38, 0); // yMin
        this.dataView.setInt16(40, 0); // xMax
        this.dataView.setInt16(42, 0); // yMax
        this.dataView.setUint16(44, 0); // macStyle
        this.dataView.setUint16(46, 1); // lowestRecPPEM
        this.dataView.setInt16(48, 2); // fontDirectionHint; Deprecated (Set to 2)
        this.dataView.setInt16(50, 1); // indexToLocFormat (1 = 32 bit offsets)
        this.dataView.setInt16(52, 0); // glyphDataFormat (0 = current format)
    },

    setFileChecksum: function(sum){
        this.dataView.setUint32(8, 0xB1B0AFBA - sum);
    },

    setFlags: function(flags){
        this.dataView.setUint16(16, flags);
    },

    setUintsPerEM: function(flags){
        this.dataView.setUint16(18, flags);
    },

    setItalic: function(){
        this.dataView.setUint16(44, this.dataView.getUint16(44) | 0x2);
    },

    setBold: function(){
        this.dataView.setUint16(44, this.dataView.getUint16(44) | 0x1);
    },

    setBoundingBox: function(xmin, ymin, xmax, ymax){
        this.dataView.setInt16(36, xmin);
        this.dataView.setInt16(38, ymin);
        this.dataView.setInt16(40, xmax);
        this.dataView.setInt16(42, ymax);
    }

});

JSClass("FNTOpenTypeConstructorTableHhea", FNTOpenTypeConstructorTable, {

    init: function(){
        this.data = JSData.initWithLength(36);
        this.dataView = this.data.dataView();
        this.dataView.setUint16(0, 1); // major version (set to 1)
        this.dataView.setUint16(2, 0); // minor version (set to 0)
        this.dataView.setInt16(4, 0); // ascender
        this.dataView.setInt16(6, 0); // descender
        this.dataView.setInt16(8, 0); // lineGap
        this.dataView.setUint16(10, 0); // advanceWidthMax
        this.dataView.setInt16(12, 0); // minLeftSideBearing
        this.dataView.setInt16(14, 0); // minRightSideBearing
        this.dataView.setUint16(16, 0); // xMaxExtent
        this.dataView.setInt16(18, 1); // caretSlopeRise (1 = vertical)
        this.dataView.setInt16(20, 0); // caretSlopeRun (0 = vertical)
        this.dataView.setInt16(22, 0); // caretOffset (0 for non slanted)
        this.dataView.setInt16(24, 0); // reserved (set to 0)
        this.dataView.setInt16(26, 0); // reserved (set to 0)
        this.dataView.setInt16(28, 0); // reserved (set to 0)
        this.dataView.setInt16(30, 0); // reserved (set to 0)
        this.dataView.setInt16(32, 0); // metricDataFormat (0 for current format)
        this.dataView.setUint16(34, 0); // numberOfHMetrics
    },

    setLineHeight: function(ascender, descender){
        this.dataView.setInt16(4, ascender);
        this.dataView.setInt16(6, descender);
    },

    setNumberOfHMetrics: function(numberOfHMetrics){
        this.dataView.setUint16(34, numberOfHMetrics);
    }

});

JSClass("FNTOpenTypeConstructorTableHmtx", FNTOpenTypeConstructorTable, {

    init: function(){
    },

    setWidths: function(widths){
        // TODO: set data
    }

});

JSClass("FNTOpenTypeConstructorTableName", FNTOpenTypeConstructorTable, {

    init: function(){
    },

});

JSClass("FNTOpenTypeConstructorTableMaxp", FNTOpenTypeConstructorTable, {

    init: function(){
        this.data = JSData.initWithLength(6);
        this.dataView = this.data.dataView();
        this.dataView.setInt16(0, 0);
        this.dataView.setInt16(2, 0x5000);
    },

    setNumberOfGlyphs: function(numberOfGlyphs){
        this.dataView.setUint16(4, numberOfGlyphs);
    }

});

JSClass("FNTOpenTypeConstructorTableOS2", FNTOpenTypeConstructorTable, {

    init: function(){
        this.data = JSData.initWithLength(100);
        this.dataView = this.data.dataView();
        this.dataView.setUint16(0, 5); // version
        this.dataView.setInt16(2, 0); // xAvgCharWidth
        this.dataView.setUint16(4, 400); // usWeightClass
        this.dataView.setUint16(6, 5); // usWidthClass
        this.dataView.setUint16(8, 0); // fsType
        this.dataView.setInt16(10, 0); // ySubscriptXSize
        this.dataView.setInt16(12, 0); // ySubscriptYSize
        this.dataView.setInt16(14, 0); // ySubscriptXOffset
        this.dataView.setInt16(16, 0); // ySubscriptYOffset
        this.dataView.setInt16(18, 0); // ySuperscriptXSize
        this.dataView.setInt16(20, 0); // ySuperscriptYSize
        this.dataView.setInt16(22, 0); // ySuperscriptXOffset
        this.dataView.setInt16(24, 0); // ySuperscriptYOffset
        this.dataView.setInt16(26, 0); // yStrikeoutSize
        this.dataView.setInt16(28, 0); // yStrikeoutPosition
        this.dataView.setInt16(30, 0); // sFamilyClass
        this.dataView.setUint8(32, 0); // panose
        this.dataView.setUint8(33, 0); // panose
        this.dataView.setUint8(34, 0); // panose
        this.dataView.setUint8(35, 0); // panose
        this.dataView.setUint8(36, 0); // panose
        this.dataView.setUint8(37, 0); // panose
        this.dataView.setUint8(38, 0); // panose
        this.dataView.setUint8(39, 0); // panose
        this.dataView.setUint8(40, 0); // panose
        this.dataView.setUint8(41, 0); // panose
        this.dataView.setUint32(42, 0); // ulUnicodeRange1
        this.dataView.setUint32(46, 0); // ulUnicodeRange2
        this.dataView.setUint32(50, 0); // ulUnicodeRange3
        this.dataView.setUint32(54, 0); // ulUnicodeRange4
        this.dataView.setUint32(58, 0); // achVendID
        this.dataView.setUint16(62, 0); // fsSelection
        this.dataView.setUint16(64, 0); // usFirstCharIndex
        this.dataView.setUint16(66, 0); // usLastCharIndex
        this.dataView.setInt16(68, 0); // sTypoAscender
        this.dataView.setInt16(70, 0); // sTypoDescender
        this.dataView.setInt16(72, 0); // sTypoLineGap
        this.dataView.setUint16(74, 0); // usWinAscent
        this.dataView.setUint16(76, 0); // usWinDescent
        this.dataView.setUint32(78, 0); // ulCodePageRange1
        this.dataView.setUint32(82, 0); // ulCodePageRange2
        this.dataView.setInt16(86, 0); // sxHeight
        this.dataView.setInt16(88, 0); // sCapHeight
        this.dataView.setUint16(90, 0); // usDefaultChar
        this.dataView.setUint16(92, 0x20); // usBreakChar (use space)
        this.dataView.setUint16(94, 3); // usMaxContext
        this.dataView.setUint16(96, 0); // usLowerOpticalPointSize
        this.dataView.setUint16(98, 0xFFFF); // usUpperOpticalPointSize
    },

    setAverageCharWidth: function(width){
        this.dataView.setInt16(2, width);
    },

    setWeightClass: function(weight){
        this.dataView.setUint16(4, weight);
    },

    setWidthClass: function(width){
        this.dataView.setUint16(6, width);
    },

    setLineHeight: function(ascender, descender){
        this.dataView.setInt16(68, ascender); // sTypoAscender
        this.dataView.setInt16(70, descender); // sTypoDescender
        this.dataView.setUint16(74, ascender); // usWinAscent
        this.dataView.setUint16(76, -descender); // usWinDescent
    }

});

JSClass("FNTOpenTypeConstructorTablePost", FNTOpenTypeConstructorTable, {

    init: function(){
    },

});

JSClass("FNTOpenTypeConstructorTableCmap", FNTOpenTypeConstructorTable, {

    init: function(){
    },

});

})();
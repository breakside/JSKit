// #import "Foundation/Foundation.js"
/* global JSClass, JSObject, JSData, FNTOpenTypeConstructor */
/* global FNTOpenTypeFontTableHead, FNTOpenTypeFontTableHhea, FNTOpenTypeFontTableOS2, FNTOpenTypeFontTableMaxp, FNTOpenTypeFontTablePost, FNTOpenTypeFontTableHtmx, FNTOpenTypeFontTableName, FNTOpenTypeFontTableCmap */
'use strict';

(function(){

JSClass("FNTOpenTypeConstructor", JSObject, {

    _tables: null,
    version: 0x4F54544F,
    head: null,

    initWithGlyphType: function(glyphType){
        // head  Font header
        this.head = FNTOpenTypeFontTableHead.init();
        // OS/2  OS/2 and Windows specific metrics
        this.OS2 = FNTOpenTypeFontTableOS2.init();
        // hhea  Horizontal header
        this.hhea = FNTOpenTypeFontTableHhea.init();
        // maxp  Maximum profile
        if (glyphType == FNTOpenTypeConstructor.GlyphType.compactFontFormat){
            this.maxp = FNTOpenTypeFontTableMaxp.initVersion05();
        }else{
            this.maxp = FNTOpenTypeFontTableMaxp.initVersion1();
        }
        // post  PostScript information
        this.post = FNTOpenTypeFontTablePost.init();
        // name  Naming table
        this.name = FNTOpenTypeFontTableName.init();
        // hmtx  Horizontal metrics
        this.hmtx = FNTOpenTypeFontTableHtmx.init();
        // cmap  Character to glyph mapping
        this.cmap = FNTOpenTypeFontTableCmap.init();

        this._tables = [
            this.head,
            this.OS2,
            this.hhea,
            this.maxp,
            this.post,
            this.name,
            this.hmtx,
            this.cmap
        ];
    },

    addTable: function(table){
        this._tables.push(table);
    },

    setLineHeight: function(ascender, descender){
        this.hhea.ascender = ascender;
        this.hhea.descender = descender;
        this.OS2.setLineHeight(ascender, descender);
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
            tableRecordView.setUint32(4, table.calculateChecksum());
            tableRecordView.setUint32(8, tableOffset);
            tableRecordView.setUint32(12, table.alignedLength);
            chunks.push(table.data);
            tableOffset += table.alignedLength;
            align = table.alignedLength - table.length;
            if (align !== 0){
                zeros = JSData.initWithLength(align);
                chunks.push(zeros);
            }
        }

        var sum = Checksum();
        for (i = 0, l = chunks.length; i < l; ++i){
            sum.update(chunks[i]);
        }
        this.head.setFileChecksum(sum.value[0]);

        var data = JSData.initWithChunks(chunks);
        completion.call(target, data);
    }

});

FNTOpenTypeConstructor.GlyphType = {
    trueType: 0,
    compactFontFormat: 1
};

var Checksum = function(){
    if (this === undefined){
        return new Checksum();
    }
    this.value = new Uint32Array(1);
    this.shift = 24;
};

Checksum.prototype = {
    update: function(data){
        for (var i = 0, l = data.length; i < l; ++i){
            this.value[0] += data[i] << this.shift;
            this.shift -= 8;
            if (this.shift < 0){
                this.shift = 24;
            }
        }
    }
};

})();
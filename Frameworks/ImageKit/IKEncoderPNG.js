// #import "ImageKit/IKEncoder.js"
// #import "ImageKit/IKBitmap.js"
/* global IKEncoder, JSClass, JSData, ZlibStream, JSRange, IKEncoderPNG, IKBitmap */
'use strict';

(function(){

JSClass("IKEncoderPNG", IKEncoder, {
    format: IKBitmap.Format.png,

    getData: function(){
        var i, l;
        var chunks = [];

        // Header
        var header = new Chunk("IHDR", 13);
        header.dataView.setUint32(this.bitmap.size.width, 0);
        header.dataView.setUint32(this.bitmap.size.height, 4);
        header.dataView.setUint8(8, 8); // bit depth
        header.dataView.setUint8(6, 9); // color type (6 = rgba)
        header.dataView.setUint8(0, 10); // compression method (0 = flate)
        header.dataView.setUint8(0, 11); // filter method (0 = adaptive)
        header.dataView.setUint8(0, 12); // interlace method (0 = none)
        chunks.push(header);

        // Color space (sRGB with spec-recommended fallback gAMA and CHRM)
        chunks.push(new Chunk("sRGB"));
        var gamma = new Chunk("gAMA", 4);
        gamma.dataView.setUint32(45455, 0);
        chunks.push(gamma);

        var chrm = new Chunk("cHRM", 32);
        chrm.dataView.setUint32(31270, 0);
        chrm.dataView.setUint32(32900, 4);
        chrm.dataView.setUint32(64000, 8);
        chrm.dataView.setUint32(33000, 12);
        chrm.dataView.setUint32(30000, 16);
        chrm.dataView.setUint32(60000, 20);
        chrm.dataView.setUint32(15000, 24);
        chrm.dataView.setUint32(6000, 28);
        chunks.push(chrm);

        // Compressed data
        var bitmapData = this.bitmap.data;
        var stream = new ZlibStream();
        var scanLineLength = this.bitmap.size.width * 4;
        var scanLine;
        var range = JSRange(0, scanLineLength);
        var filteredLine = JSData.initWithLength(1 + scanLineLength);
        var output = JSData.initWithLength(0xFFFF);
        var outputLength = 0;
        var idat;
        for (l = bitmapData.length; range.location < l; range.location += scanLineLength){
            scanLine = bitmapData.subdataInRange(range);
            scanLine.copyTo(filteredLine, 1);
            // Type 1, Sub filter
            filteredLine[0] = 1;
            for (var j = scanLineLength; j > 4; --j){
                filteredLine[j] -= filteredLine[j - 4];
            }
            stream.input = filteredLine;
            do{
                if (outputLength == output.length){
                    idat = new Chunk('IDAT', outputLength);
                    output.copyTo(idat.data, 8);
                    chunks.push(idat);
                    outputLength = 0;
                }
                stream.outputOffset = outputLength;
                outputLength += stream.deflate(range.location + scanLineLength >= l).length;
            }while (outputLength == output.length);
        }
        if (outputLength > 0){
            idat = new Chunk('IDAT', outputLength);
            output.copyTo(idat.data, 8);
            chunks.push(idat);
        }

        // End
        chunks.push(new Chunk("IEND"));

        // Checksum and combine all chunk data
        var chunk;
        var dataChunks = [];
        for (i = 0, l = this.chunks.length; i < l; ++i){
            chunk = chunks[i];
            chunk.calculateChecksum();
            dataChunks.push(chunk.data);
        }
        return JSData.initWithChunks(dataChunks);
    }
});

var Chunk = function(name, length){
    if (this === undefined){
        return new Chunk(name, length);
    }
    if (length === undefined){
        length = 0;
    }
    this.data = JSData.initWithLength(length + 12);
    name.latin1().copyTo(this.data, 4);
    this._chunkDataView = this.data.dataView();
    this._chunkDataView.setUint32(length, 0);
    this.dataView = this.data.subdataInRange(JSRange(8, length)).dataView();
};

Chunk.prototype = {

    calculateChecksum: function(){
        // calculated 
    }

};

})();
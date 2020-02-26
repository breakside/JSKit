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

// #import "IKEncoder.js"
// #import "IKBitmap.js"
// #import "IKDecoderPNG.js"
'use strict';

(function(){

JSClass("IKEncoderPNG", IKEncoder, {
    format: IKBitmap.Format.png,

    getData: function(){
        var i, l;
        var chunks = [];

        // Header
        var header = new Chunk("IHDR", 13);
        header.dataView.setUint32(0, this.bitmap.size.width);
        header.dataView.setUint32(4, this.bitmap.size.height);
        header.dataView.setUint8(8, 8); // bit depth
        header.dataView.setUint8(9, 6); // color type (6 = rgba)
        header.dataView.setUint8(10, 0); // compression method (0 = flate)
        header.dataView.setUint8(11, 0); // filter method (0 = adaptive)
        header.dataView.setUint8(12, 0); // interlace method (0 = none)
        chunks.push(header);

        // Color space (sRGB with spec-recommended fallback gAMA and CHRM)
        chunks.push(new Chunk("sRGB"));
        var gamma = new Chunk("gAMA", 4);
        gamma.dataView.setUint32(0, 45455);
        chunks.push(gamma);

        var chrm = new Chunk("cHRM", 32);
        chrm.dataView.setUint32(0, 31270);
        chrm.dataView.setUint32(4, 32900);
        chrm.dataView.setUint32(8, 64000);
        chrm.dataView.setUint32(12, 33000);
        chrm.dataView.setUint32(16, 30000);
        chrm.dataView.setUint32(20, 60000);
        chrm.dataView.setUint32(24, 15000);
        chrm.dataView.setUint32(28, 6000);
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
        var totalOutputLength = 0;
        var idat;
        var length;
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
                stream.output = output;
                stream.outputOffset = outputLength;
                length = stream.compress(range.location + scanLineLength >= l).length;
                outputLength += length;
                totalOutputLength += length;
            }while (outputLength == output.length);
        }
        if (outputLength > 0){
            idat = new Chunk('IDAT', outputLength);
            output.subdataInRange(JSRange(0, outputLength)).copyTo(idat.data, 8);
            chunks.push(idat);
        }

        // End
        chunks.push(new Chunk("IEND"));

        // Checksum and combine all chunk data
        var chunk;
        var dataChunks = [
            // magic bytes
            JSData.initWithArray([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A])
        ];
        for (i = 0, l = chunks.length; i < l; ++i){
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
    this._chunkDataView.setUint32(0, length);
    this.dataView = this.data.subdataInRange(JSRange(8, length)).dataView();
};

Chunk.prototype = {

    calculateChecksum: function(){
        var crc = new CRC();
        crc.update(this.data.subdataInRange(JSRange(4, this.data.length - 8)));
        this._chunkDataView.setUint32(this.data.length - 4, crc.final);
    }

};

IKEncoderPNG.Chunk = Chunk;

var CRC = IKDecoderPNG.CRC;

})();
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

// #import QRKit
// #import TestKit
'use strict';

JSClass("QRCodeBitstreamTests", TKTestSuite, {

    testWrite: function(){
        var bitstream = QRCodeBitstream.initWithCodewordLength(10);
        bitstream.writeBits(3, 2);
        bitstream.writeBits(12, 4);
        bitstream.writeBits(10, 4);
        bitstream.writeBits(300, 10);
        bitstream.writeBits(1234, 16);
        bitstream.writeBits(1, 5);
        var codewords = bitstream.codewords();
        TKAssertEquals(codewords.length, 6);
        TKAssertEquals(codewords[0], 0xf2);
        TKAssertEquals(codewords[1], 0x92);
        TKAssertEquals(codewords[2], 0xc0);
        TKAssertEquals(codewords[3], 0x4d);
        TKAssertEquals(codewords[4], 0x20);
        TKAssertEquals(codewords[5], 0x80);
    }

});
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

// #import ImageKit
// #import TestKit
'use strict';

JSClass("IKEncoderPNGTests", TKTestSuite, {

    testBasicPNG: function(){
        var bitmapData = JSData.initWithArray([255,0,0,255,0,255,0,255,0,0,255,255,255,255,255,255]);
        var bitmap = IKBitmap.initWithData(bitmapData, JSSize(2,2));
        var encoder = IKEncoderPNG.initWithBitmap(bitmap);
        var data = encoder.getData();
        TKAssertNotNull(data);
        var bitmap2 = IKBitmap.initWithEncodedData(data);
        TKAssertNotNull(bitmap2);
        TKAssertNotNull(bitmap2.data);
        TKAssertNotNull(bitmap2.size);
        TKAssertEquals(bitmap2.size.width, 2);
        TKAssertEquals(bitmap2.size.height, 2);
        TKAssertEquals(bitmap2.data.length, 16);
        TKAssertEquals(bitmap2.data[0], 255);
        TKAssertEquals(bitmap2.data[1], 0);
        TKAssertEquals(bitmap2.data[2], 0);
        TKAssertEquals(bitmap2.data[3], 255);
        TKAssertEquals(bitmap2.data[4], 0);
        TKAssertEquals(bitmap2.data[5], 255);
        TKAssertEquals(bitmap2.data[6], 0);
        TKAssertEquals(bitmap2.data[7], 255);
        TKAssertEquals(bitmap2.data[8], 0);
        TKAssertEquals(bitmap2.data[9], 0);
        TKAssertEquals(bitmap2.data[10], 255);
        TKAssertEquals(bitmap2.data[11], 255);
        TKAssertEquals(bitmap2.data[12], 255);
        TKAssertEquals(bitmap2.data[13], 255);
        TKAssertEquals(bitmap2.data[14], 255);
        TKAssertEquals(bitmap2.data[15], 255);
    }

});
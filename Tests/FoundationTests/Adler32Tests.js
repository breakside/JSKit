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
// #import TestKit
'use strict';

JSClass("Adler32Tests", TKTestSuite, {

    testConstructor: function(){
        var checksum = new Adler32();
        TKAssertNotNull(checksum);
        TKAssert(checksum instanceof Adler32);
        TKAssertEquals(checksum.sum, 1);
    },

    testEmptyFunction: function(){
        var checksum = Adler32();
        TKAssertNotNull(checksum);
        TKAssert(checksum instanceof Adler32);
        TKAssertEquals(checksum.sum, 1);
    },

    testBytesFunction: function(){
        /// Tested against results from macOS app:
        /// #include <stdio.h>
        /// #include <zlib.h>
        /// int main(int argc, const char * argv[]) {
        ///     uint8_t bytes[] = {0,1,2,3,4,5,6,7,8,9};
        ///     unsigned long adler32 = 1;
        ///     adler32 = adler32_z(adler32, bytes, sizeof(bytes));
        ///     printf("adler32: %lu\n", adler32);
        ///     return 0;
        /// }
        var data = new Uint8Array([0,1,2,3,4,5,6,7,8,9]);
        var sum = Adler32(data);
        TKAssert(!(sum instanceof Adler32));
        TKAssertEquals(sum, 11468846);

        data = new Uint8Array([11,22,33,44,55,66,77,88,99]);
        sum = Adler32(data);
        TKAssertEquals(sum, 119538160);

        sum = Adler32("this is a test".utf8());
        TKAssertEquals(sum, 640877846);
    },

    testIncludeBytes: function(){
        var data1 = new Uint8Array([0,1]);
        var data2 = new Uint8Array([2,3,4]);
        var data3 = new Uint8Array([5,6,7,8,9]);
        var checksum = Adler32();
        checksum.includeBytes(data1);
        checksum.includeBytes(data2);
        checksum.includeBytes(data3);
        TKAssertEquals(checksum.sum, 11468846);

        data1 = new Uint8Array([11]);
        data2 = new Uint8Array([22,33,44]);
        data3 = new Uint8Array([55,66,77,88,99]);
        checksum = Adler32();
        checksum.includeBytes(data1);
        checksum.includeBytes(new Uint8Array(0));
        checksum.includeBytes(data2);
        checksum.includeBytes(data3);
        TKAssertEquals(checksum.sum, 119538160);
    }

});
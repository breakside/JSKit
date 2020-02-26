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

// #import FontKit
// #import TestKit
'use strict';

JSClass("FNTOpenTypeConstructorTests", TKTestSuite, {

    testInitWithGlyphType: function(){
        var constructor = FNTOpenTypeConstructor.initWithGlyphType(FNTOpenTypeConstructor.GlyphType.trueType);
        TKAssertEquals(constructor.version, 0x00010000);
        TKAssertEquals(constructor.maxp.majorVersion, 1);
        TKAssertEquals(constructor.maxp.minorVersion, 0);

        constructor = FNTOpenTypeConstructor.initWithGlyphType(FNTOpenTypeConstructor.GlyphType.compactFontFormat);
        TKAssertEquals(constructor.version, 0x4F54544F);
        TKAssertEquals(constructor.maxp.majorVersion, 0);
        TKAssertEquals(constructor.maxp.minorVersion, 0x5000);
    },

    testGetData: function(){
        var constructor = FNTOpenTypeConstructor.initWithGlyphType(FNTOpenTypeConstructor.GlyphType.trueType);
        var expectation = TKExpectation.init();
        expectation.call(constructor.getData, constructor, function(data){
            TKAssertNotNull(data);
            var font = FNTOpenTypeFont.initWithData(data);
            var tags = Object.keys(font.tableIndex);
            TKAssertEquals(font.version, 0x00010000);
            TKAssertEquals(font.searchRange, 128);
            TKAssertEquals(font.entrySelector, 3);
            TKAssertEquals(font.rangeShift, 0);
            TKAssertEquals(tags.length, 8);
            TKAssertEquals(tags[0], 'OS/2');
            TKAssertEquals(tags[1], 'cmap');
            TKAssertEquals(tags[2], 'head');
            TKAssertEquals(tags[3], 'hhea');
            TKAssertEquals(tags[4], 'hmtx');
            TKAssertEquals(tags[5], 'maxp');
            TKAssertEquals(tags[6], 'name');
            TKAssertEquals(tags[7], 'post');
            for (var tag in font.tableIndex){
                TKAssertEquals(font.tableIndex[tag].offset % 4, 0, tag);
            }
            font.validateChecksums();
        });
        this.wait(expectation, 2.0);
    }

});
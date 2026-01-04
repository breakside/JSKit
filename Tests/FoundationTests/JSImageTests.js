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

JSClass("JSImageTests", TKTestSuite, {

    testResourceData: function(){
        var image = JSImage.initWithResourceName('test', JSBundle.testBundle);
        TKAssertNotNull(image);

        var expectation = TKExpectation.init();
        expectation.call(image.getData, image, function(data){
            TKAssertNotNull(data);
            TKAssertObjectEquals(data, [0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A,0x00,0x00,0x00,0x0D,0x49,0x48,0x44,0x52,0x00,0x00,0x00,0x02,0x00,0x00,0x00,0x02,0x08,0x02,0x00,0x00,0x00,0xFD,0xD4,0x9A,0x73,0x00,0x00,0x00,0x01,0x73,0x52,0x47,0x42,0x00,0xAE,0xCE,0x1C,0xE9,0x00,0x00,0x00,0x15,0x49,0x44,0x41,0x54,0x08,0x1D,0x63,0xF8,0xCF,0xC0,0xC0,0xF0,0x9F,0x81,0x11,0x48,0xFC,0xFF,0xCF,0x00,0x00,0x1E,0xF6,0x04,0xFD,0xA0,0x06,0x5A,0x06,0x00,0x00,0x00,0x00,0x49,0x45,0x4E,0x44,0xAE,0x42,0x60,0x82]);
        });

        this.wait(expectation, 2.0);
    },

    testInitWithData: function(){
        var svg = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<svg width="12px" height="34px" viewBox="0 0 12 34" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">',
            '</svg>'
        ].join("\n");
        var image = JSImage.initWithData(svg.utf8());
        TKAssertExactEquals(image.size.width, 12);
        TKAssertExactEquals(image.size.height, 34);

        svg = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<svg width="12" height="34" viewBox="0 0 12 34" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">',
            '</svg>'
        ].join("\n");
        image = JSImage.initWithData(svg.utf8());
        TKAssertExactEquals(image.size.width, 12);
        TKAssertExactEquals(image.size.height, 34);

        svg = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<svg viewBox="0 0 12 34" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">',
            '</svg>'
        ].join("\n");
        image = JSImage.initWithData(svg.utf8());
        TKAssertExactEquals(image.size.width, 12);
        TKAssertExactEquals(image.size.height, 34);

        svg = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<svg width="12em" height="34em" viewBox="0 0 12 34" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">',
            '</svg>'
        ].join("\n");
        image = JSImage.initWithData(svg.utf8());
        TKAssertExactEquals(image.size.width, 144);
        TKAssertExactEquals(image.size.height, 408);

        svg = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<svg width="12ex" height="34ex" viewBox="0 0 12 34" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">',
            '</svg>'
        ].join("\n");
        image = JSImage.initWithData(svg.utf8());
        TKAssertExactEquals(image.size.width, 288);
        TKAssertExactEquals(image.size.height, 816);

        svg = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<svg width="12in" height="34in" viewBox="0 0 12 34" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">',
            '</svg>'
        ].join("\n");
        image = JSImage.initWithData(svg.utf8());
        TKAssertExactEquals(image.size.width, 864);
        TKAssertExactEquals(image.size.height, 2448);

        svg = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<svg width="12cm" height="34cm" viewBox="0 0 12 34" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">',
            '</svg>'
        ].join("\n");
        image = JSImage.initWithData(svg.utf8());
        TKAssertFloatEquals(image.size.width, 864/2.54);
        TKAssertFloatEquals(image.size.height, 2448/2.54);

        svg = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<svg width="12mm" height="34mm" viewBox="0 0 12 34" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">',
            '</svg>'
        ].join("\n");
        image = JSImage.initWithData(svg.utf8());
        TKAssertFloatEquals(image.size.width, 864/25.4);
        TKAssertFloatEquals(image.size.height, 2448/25.4);

        svg = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<svg width="12pt" height="34pt" viewBox="0 0 12 34" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">',
            '</svg>'
        ].join("\n");
        image = JSImage.initWithData(svg.utf8());
        TKAssertFloatEquals(image.size.width, 12);
        TKAssertFloatEquals(image.size.height, 34);

        svg = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<svg width="12pc" height="34pc" viewBox="0 0 12 34" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">',
            '</svg>'
        ].join("\n");
        image = JSImage.initWithData(svg.utf8());
        TKAssertExactEquals(image.size.width, 144);
        TKAssertExactEquals(image.size.height, 408);
        
        // XML 1.0 doesn't require the XML prolog, and many SVG documents don't include it
        svg = [
            '<svg width="12px" height="34px" viewBox="0 0 12 34" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">',
            '</svg>'
        ].join("\n");
        image = JSImage.initWithData(svg.utf8());
        TKAssertExactEquals(image.size.width, 12);
        TKAssertExactEquals(image.size.height, 34);

        svg = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<svg width="" height="" viewBox="0 0 12 34" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">',
            '</svg>'
        ].join("\n");
        image = JSImage.initWithData(svg.utf8());
        TKAssertExactEquals(image.size.width, 12);
        TKAssertExactEquals(image.size.height, 34);

        svg = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<svg viewBox="0 0 12 34" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">',
            '</svg>'
        ].join("\n");
        image = JSImage.initWithData(svg.utf8());
        TKAssertExactEquals(image.size.width, 12);
        TKAssertExactEquals(image.size.height, 34);

        svg = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<svg width="20px" viewBox="0 0 12 34" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">',
            '</svg>'
        ].join("\n");
        image = JSImage.initWithData(svg.utf8());
        TKAssertExactEquals(image.size.width, 12);
        TKAssertExactEquals(image.size.height, 34);

        svg = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<svg height="20px" viewBox="0 0 12 34" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">',
            '</svg>'
        ].join("\n");
        image = JSImage.initWithData(svg.utf8());
        TKAssertExactEquals(image.size.width, 12);
        TKAssertExactEquals(image.size.height, 34);

        svg = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<svg width="auto" height="auto" viewBox="0 0 12 34" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">',
            '</svg>'
        ].join("\n");
        image = JSImage.initWithData(svg.utf8());
        TKAssertExactEquals(image.size.width, 12);
        TKAssertExactEquals(image.size.height, 34);

        svg = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<svg width="100%" height="50%" viewBox="0 0 12 34" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">',
            '</svg>'
        ].join("\n");
        image = JSImage.initWithData(svg.utf8());
        TKAssertExactEquals(image.size.width, 12);
        TKAssertExactEquals(image.size.height, 34);

        svg = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<svg width="100%" height="50%" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">',
            '</svg>'
        ].join("\n");
        image = JSImage.initWithData(svg.utf8());
        TKAssertExactEquals(image.size.width, 1);
        TKAssertExactEquals(image.size.height, 1);

        svg = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">',
            '</svg>'
        ].join("\n");
        image = JSImage.initWithData(svg.utf8());
        TKAssertExactEquals(image.size.width, 1);
        TKAssertExactEquals(image.size.height, 1);

        svg = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<svg viewBox="0 0 x y" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">',
            '</svg>'
        ].join("\n");
        image = JSImage.initWithData(svg.utf8());
        TKAssertExactEquals(image.size.width, 1);
        TKAssertExactEquals(image.size.height, 1);

        svg = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<svg viewBox="0 0 12 y" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">',
            '</svg>'
        ].join("\n");
        image = JSImage.initWithData(svg.utf8());
        TKAssertExactEquals(image.size.width, 1);
        TKAssertExactEquals(image.size.height, 1);

        svg = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<svg viewBox="0 0 x 34" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">',
            '</svg>'
        ].join("\n");
        image = JSImage.initWithData(svg.utf8());
        TKAssertExactEquals(image.size.width, 1);
        TKAssertExactEquals(image.size.height, 1);
    },

    testInitWithData_JPEGOrientation: {
        inputs: {
            orientation0: ["jpg_orientation0", 200, 300],
            orientation1: ["jpg_orientation1", 200, 300],
            orientation2: ["jpg_orientation2", 200, 300],
            orientation3: ["jpg_orientation3", 200, 300],
            orientation4: ["jpg_orientation4", 200, 300],
            orientation5: ["jpg_orientation5", 300, 200],
            orientation6: ["jpg_orientation6", 300, 200],
            orientation7: ["jpg_orientation7", 300, 200],
            orientation8: ["jpg_orientation8", 300, 200],
            manyExif0: ["jpg_many_exif0", 200, 300],
            manyExif6: ["jpg_many_exif6", 300, 200],
        },
        test: function(resourceName, expectedWidth, expectedHeight){

            var metadata = JSBundle.testBundle.metadataForResourceName(resourceName);
            TKAssertNotNull(metadata);

            var expectation = TKExpectation.init();
            expectation.call(JSBundle.testBundle.getResourceData, JSBundle.testBundle, metadata, function(data){
                TKAssertNotNull(data);
                var image = JSImage.initWithData(data);
                TKAssertNotNull(image);
                TKAssertExactEquals(image.size.width, expectedWidth);
                TKAssertExactEquals(image.size.height, expectedHeight);
            });

            this.wait(expectation, 2.0);
        }
    },

});
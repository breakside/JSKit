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

JSClass('JSFormFieldMapTests', TKTestSuite, {

    testFormFieldConstructor: function(){
        var field = JSFormField("a", "1");
        TKAssertExactEquals(field.name, "a");
        TKAssertExactEquals(field.value, "1");

        field = JSFormField("a", 2);
        TKAssertExactEquals(field.name, "a");
        TKAssertExactEquals(field.value, "2");

        field = JSFormField("a");
        TKAssertExactEquals(field.name, "a");
        TKAssertNull(field.value);

        field = JSFormField("testing123[]", "hello there, this is a long value");
        TKAssertExactEquals(field.name, "testing123[]");
        TKAssertExactEquals(field.value, "hello there, this is a long value");
    },

    testFormFieldCopyConstructor: function(){
        var field = JSFormField(null);
        TKAssertNull(field);

        field = JSFormField("a", "1");
        var copy = JSFormField(field);
        TKAssertExactEquals(copy.name, field.name);
        TKAssertExactEquals(copy.value, field.value);
    },

    testFormFieldMapConstructor: function(){
        var map = JSFormFieldMap();
        TKAssertNotNull(map);
        TKAssertEquals(map.fields.length, 0);
    },

    testFormFieldMapAdd: function(){
        var map = JSFormFieldMap();
        TKAssertNotNull(map);
        TKAssertEquals(map.fields.length, 0);
        map.add("test", "one");
        TKAssertEquals(map.fields.length, 1);
        map.add("two");
        TKAssertEquals(map.fields.length, 2);
    },

    testFormFieldMapGet: function(){
        var map = JSFormFieldMap();
        TKAssertNotNull(map);
        TKAssertEquals(map.fields.length, 0);
        map.add("test", "one");
        TKAssertEquals(map.fields.length, 1);
        TKAssertExactEquals(map.get("test"), "one");
        map.add("two");
        TKAssertEquals(map.fields.length, 2);
        TKAssertExactEquals(map.get("test"), "one");
        TKAssertNull(map.get("two"));
        TKAssertUndefined(map.get("three"));
    },

    testFormFieldMapGetAll: function(){
        var map = JSFormFieldMap();
        TKAssertNotNull(map);
        TKAssertEquals(map.fields.length, 0);
        map.add("test", "one");
        TKAssertEquals(map.fields.length, 1);
        TKAssertExactEquals(map.get("test"), "one");
        var all = map.getAll("test");
        TKAssertEquals(all.length, 1);
        TKAssertExactEquals(all[0], "one");
        map.add("test", "two");
        TKAssertEquals(map.fields.length, 2);
        TKAssertExactEquals(map.get("test"), "one");
        all = map.getAll("test");
        TKAssertExactEquals(all.length, 2);
        TKAssertExactEquals(all[0], "one");
        TKAssertExactEquals(all[1], "two");
    },

    testFormFieldDecode: function(){
        var encoded = "test=one".utf8();
        var map = JSFormFieldMap();
        map.decode(encoded, true);
        TKAssertEquals(map.fields.length, 1);
        TKAssertExactEquals(map.get("test"), "one");

        encoded = "test=one+two&another=H%C3%A8llo&th%3Dird=Owen+%26+100%25".utf8();
        map = JSFormFieldMap();
        map.decode(encoded, true);
        TKAssertEquals(map.fields.length, 3);
        TKAssertExactEquals(map.get("test"), "one two");
        TKAssertExactEquals(map.get("another"), "Hèllo");
        TKAssertExactEquals(map.get("th=ird"), "Owen & 100%");
    }

});

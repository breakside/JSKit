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

JSClass("JSObjectTests", TKTestSuite, {

    testObjectID: function(){
        var x = JSObject.init();
        TKAssertNotUndefined(x.objectID);
        TKAssertNotNull(x.objectID);
    },

    testAddObserverForKeyPathSimpleKey: function(){
        var A = JSObject.$extend({
            name: null,
            count: 0
        }, "A");

        var B = JSObject.$extend({
            observation: null,
            observationCount: 0,
            value: null,
            observeValueForKeyPath: function(keyPath, ofObject, change, context){
                ++this.observationCount;
                this.observation = {
                    keyPath: keyPath,
                    ofObject: ofObject,
                    change: change,
                    context: context
                };
            }
        }, "B");

        var a = A.init();
        var b = B.init();
        var context = {};

        a.addObserverForKeyPath(b, "name", null, context);
        TKAssertNull(b.observation);
        a.name = "test1";
        TKAssertEquals(b.observationCount, 1);
        TKAssertNotNull(b.observation);
        TKAssertEquals(b.observation.keyPath, "name");
        TKAssertExactEquals(b.observation.ofObject, a);
        TKAssertNotNull(b.observation.change);
        TKAssertEquals(b.observation.change.type, JSObject.KeyValueChange.Setting);
        TKAssertEquals(b.observation.change.newValue, "test1");
        TKAssertExactEquals(b.observation.context, context);
    },

    testAddObserverForKeyPathCompoundKey: function(){
        var A = JSObject.$extend({
            person: null,
        }, "A");

        var B = JSObject.$extend({
            name: "",
        }, "B");

        var C = JSObject.$extend({
            observationCount: 0,
            observation: null,
            value: null,
            observeValueForKeyPath: function(keyPath, ofObject, change, context){
                ++this.observationCount;
                this.observation = {
                    keyPath: keyPath,
                    ofObject: ofObject,
                    change: change,
                    context: context
                };
            }
        }, "C");

        var a = A.init();
        var b = B.init();
        var c = C.init();
        var context = {};

        a.addObserverForKeyPath(c, "person.name", null, context);
        TKAssertNull(c.observation);
        a.person = b;
        TKAssertEquals(c.observationCount, 1);
        TKAssertNotNull(c.observation);
        TKAssertEquals(c.observation.keyPath, "person.name");
        TKAssertExactEquals(c.observation.ofObject, a);
        TKAssertNotNull(c.observation.change);
        TKAssertEquals(c.observation.change.type, JSObject.KeyValueChange.Setting);
        TKAssertExactEquals(c.observation.change.newValue, "");
        TKAssertExactEquals(c.observation.context, context);
        b.name = "test1";
        TKAssertEquals(c.observationCount, 2);
        TKAssertNotNull(c.observation);
        TKAssertEquals(c.observation.keyPath, "person.name");
        TKAssertExactEquals(c.observation.ofObject, a);
        TKAssertNotNull(c.observation.change);
        TKAssertEquals(c.observation.change.type, JSObject.KeyValueChange.Setting);
        TKAssertExactEquals(c.observation.change.newValue, "test1");
        TKAssertExactEquals(c.observation.context, context);
    },

    testAddObserverForKeyPathDoubleCompoundKey: function(){
        var A = JSObject.$extend({
            person: null,
        }, "A");

        var B = JSObject.$extend({
            name: null,
        }, "B");

        var C = JSObject.$extend({
            first: "",
            last: ""
        }, "C");

        var D = JSObject.$extend({
            observationCount: 0,
            observation: null,
            value: null,
            observeValueForKeyPath: function(keyPath, ofObject, change, context){
                ++this.observationCount;
                this.observation = {
                    keyPath: keyPath,
                    ofObject: ofObject,
                    change: change,
                    context: context
                };
            }
        }, "D");

        var a = A.init();
        var b = B.init();
        var c = C.init();
        var d = D.init();
        var context = {};

        a.addObserverForKeyPath(d, "person.name.first", null, context);
        TKAssertNull(d.observation);
        a.person = b;
        TKAssertEquals(d.observationCount, 1);
        TKAssertNotNull(d.observation);
        TKAssertEquals(d.observation.keyPath, "person.name.first");
        TKAssertExactEquals(d.observation.ofObject, a);
        TKAssertNotNull(d.observation.change);
        TKAssertEquals(d.observation.change.type, JSObject.KeyValueChange.Setting);
        TKAssertExactEquals(d.observation.change.newValue, null);
        TKAssertExactEquals(d.observation.context, context);
        b.name = c;
        TKAssertEquals(d.observationCount, 2);
        TKAssertNotNull(d.observation);
        TKAssertEquals(d.observation.keyPath, "person.name.first");
        TKAssertExactEquals(d.observation.ofObject, a);
        TKAssertNotNull(d.observation.change);
        TKAssertEquals(d.observation.change.type, JSObject.KeyValueChange.Setting);
        TKAssertExactEquals(d.observation.change.newValue, "");
        TKAssertExactEquals(d.observation.context, context);
        c.first = "test1";
        TKAssertEquals(d.observationCount, 3);
        TKAssertNotNull(d.observation);
        TKAssertEquals(d.observation.keyPath, "person.name.first");
        TKAssertExactEquals(d.observation.ofObject, a);
        TKAssertNotNull(d.observation.change);
        TKAssertEquals(d.observation.change.type, JSObject.KeyValueChange.Setting);
        TKAssertExactEquals(d.observation.change.newValue, "test1");
        TKAssertExactEquals(d.observation.context, context);
    },

    testAddObserverForKeyPathDynamicKey: function(){
        var A = JSObject.$extend({
            setCount: 0,
            name: JSDynamicProperty('_name', null),
            setName: function(name){
                this._name = name;
                ++this.setCount;
            }
        }, "A");

        var B = JSObject.$extend({
            observationCount: 0,
            observation: null,
            value: null,
            observeValueForKeyPath: function(keyPath, ofObject, change, context){
                ++this.observationCount;
                this.observation = {
                    keyPath: keyPath,
                    ofObject: ofObject,
                    change: change,
                    context: context
                };
            }
        }, "B");

        var a = A.init();
        var b = B.init();
        var context = {};

        a.addObserverForKeyPath(b, "name", null, context);
        TKAssertEquals(a.setCount, 0);
        TKAssertNull(b.observation);
        a.name = "test1";
        TKAssertEquals(a.setCount, 1);
        TKAssertEquals(b.observationCount, 1);
        TKAssertNotNull(b.observation);
        TKAssertEquals(b.observation.keyPath, "name");
        TKAssertExactEquals(b.observation.ofObject, a);
        TKAssertNotNull(b.observation.change);
        TKAssertEquals(b.observation.change.type, JSObject.KeyValueChange.Setting);
        TKAssertEquals(b.observation.change.newValue, "test1");
        TKAssertExactEquals(b.observation.context, context);
    },

    testRemoveObserverForKeyPath: function(){
        var A = JSObject.$extend({
            setCount: 0,
            name: JSDynamicProperty('_name', null),
            setName: function(name){
                this._name = name;
                ++this.setCount;
            }
        }, "A");

        var B = JSObject.$extend({
            observationCount: 0,
            value: null,
            observeValueForKeyPath: function(keyPath, ofObject, change, context){
                ++this.observationCount;
            }
        }, "B");

        var a = A.init();
        var b = B.init();
        var context = {};

        a.addObserverForKeyPath(b, "name", null, context);
        TKAssertEquals(b.observationCount, 0);
        a.name = "test1";
        TKAssertEquals(b.observationCount, 1);
        a.name = "test2";
        TKAssertEquals(b.observationCount, 2);
        a.removeObserverForKeyPath(b, "name", {});
        a.name = "test3";
        TKAssertEquals(b.observationCount, 3);
        a.removeObserverForKeyPath(b, "name", context);
        a.name = "test4";
        TKAssertEquals(b.observationCount, 3);
    },

    testRemoveObserverForKeyPathDoubleCompoundKey: function(){
        var A = JSObject.$extend({
            person: null,
        }, "A");

        var B = JSObject.$extend({
            name: null,
        }, "B");

        var C = JSObject.$extend({
            first: "",
            last: ""
        }, "C");

        var D = JSObject.$extend({
            observationCount: 0,
            observeValueForKeyPath: function(keyPath, ofObject, change, context){
                ++this.observationCount;
            }
        }, "D");

        var a = A.init();
        var b1 = B.init();
        var b2 = B.init();
        var c1 = C.init();
        var c2 = C.init();
        var d = D.init();
        var context = {};

        a.addObserverForKeyPath(d, "person.name.first", null, context);
        TKAssertEquals(d.observationCount, 0);
        a.person = b1;
        TKAssertEquals(d.observationCount, 1);
        b1.name = c1;
        TKAssertEquals(d.observationCount, 2);
        c1.first = "test1";
        TKAssertEquals(d.observationCount, 3);
        c1.first = "test2";
        TKAssertEquals(d.observationCount, 4);
        b1.name = c2;
        TKAssertEquals(d.observationCount, 5);
        c1.first = "test3";
        TKAssertEquals(d.observationCount, 5);
        c2.first = "test4";
        TKAssertEquals(d.observationCount, 6);
        a.person = b2;
        TKAssertEquals(d.observationCount, 7);

        // shouldn't get notified becaues b1 is no longer person.name
        b1.name = c1;
        TKAssertEquals(d.observationCount, 7);

        // shouldn't get notified from any change anywhere because we're no longer an observer
        a.removeObserverForKeyPath(d, "person.name.first", context);
        c1.first = "test5";
        TKAssertEquals(d.observationCount, 7);
        c2.first = "test5";
        TKAssertEquals(d.observationCount, 7);
        b1.name = c2;
        TKAssertEquals(d.observationCount, 7);
        b2.name = C.init();
        TKAssertEquals(d.observationCount, 7);
        a.person = b1;
        TKAssertEquals(d.observationCount, 7);
    },

    testBindSimpleKeyPath: function(){
        var A = JSObject.$extend({
            name: "",
            count: 0
        }, "A");

        var B = JSObject.$extend({
            value: null
        }, "B");

        var a = A.init();
        var b = B.init();
        b.bind('value', a, 'name');
        TKAssertExactEquals(b.value, "");
        a.name = "test1";
        TKAssertExactEquals(b.value, "test1");

        b.value = "test2";
        TKAssertExactEquals(b.value, "test2");
        TKAssertExactEquals(a.name, "test1");
        b.didChangeValueForBinding("value");
        TKAssertExactEquals(b.value, "test2");
        TKAssertExactEquals(a.name, "test2");
    },

    testBindDynamicKeyPath: function(){
        var A = JSObject.$extend({
            name: JSDynamicProperty('_name', ""),
            setCount: 0,
            setName: function(name){
                this._name = name;
                ++this.setCount;
            }
        }, "A");

        var B = JSObject.$extend({
            value: JSDynamicProperty("_value", null),
            setCount: 0,
            setValue: function(value){
                this._value = value;
                ++this.setCount;
            }
        }, "B");

        var a = A.init();
        var b = B.init();
        b.bind('value', a, 'name');
        TKAssertEquals(a.setCount, 0);
        TKAssertEquals(b.setCount, 1);
        TKAssertExactEquals(b.value, "");
        a.name = "test1";
        TKAssertEquals(a.setCount, 1);
        TKAssertEquals(b.setCount, 2);
        TKAssertExactEquals(b.value, "test1");

        b.value = "test2";
        TKAssertEquals(a.setCount, 1);
        TKAssertEquals(b.setCount, 3);
        TKAssertExactEquals(b.value, "test2");
        TKAssertExactEquals(a.name, "test1");
        b.didChangeValueForBinding("value");
        TKAssertEquals(a.setCount, 2);
        TKAssertEquals(b.setCount, 3);
        TKAssertExactEquals(b.value, "test2");
        TKAssertExactEquals(a.name, "test2");
    },

    testBindCompoundKeyPath: function(){
        var A = JSObject.$extend({
            person: null,
        }, "A");

        var B = JSObject.$extend({
            name: ""
        }, "B");

        var C = JSObject.$extend({
            value: null
        }, "C");

        var a = A.init();
        var b = B.init();
        var c = C.init();
        c.bind('value', a, 'person.name');
        TKAssertNull(c.value);
        a.person = b;
        TKAssertExactEquals(c.value, "");
        b.name = "test1";
        TKAssertExactEquals(c.value, "test1");

        c.value = "test2";
        TKAssertExactEquals(c.value, "test2");
        TKAssertExactEquals(b.name, "test1");
        c.didChangeValueForBinding("value");
        TKAssertExactEquals(c.value, "test2");
        TKAssertExactEquals(b.name, "test2");
    },

    testBindDoubleCompoundKeyPath: function(){
        var A = JSObject.$extend({
            person: null,
        }, "A");

        var B = JSObject.$extend({
            name: null
        }, "B");

        var C = JSObject.$extend({
            first: ""
        }, "C");

        var D = JSObject.$extend({
            value: null
        }, "D");

        var a = A.init();
        var b = B.init();
        var c = C.init();
        var d = D.init();
        d.bind('value', a, 'person.name.first');
        TKAssertNull(d.value);
        a.person = b;
        TKAssertNull(d.value);
        b.name = c;
        TKAssertExactEquals(d.value, "");
        c.first = "test1";
        TKAssertExactEquals(d.value, "test1");

        d.value = "test2";
        TKAssertExactEquals(d.value, "test2");
        TKAssertExactEquals(c.first, "test1");
        d.didChangeValueForBinding("value");
        TKAssertExactEquals(d.value, "test2");
        TKAssertExactEquals(c.first, "test2");
    },

    testUnbind: function(){
        var A = JSObject.$extend({
            name: "",
        }, "A");

        var B = JSObject.$extend({
            value: null
        }, "B");

        var a = A.init();
        var b = B.init();
        b.bind('value', a, 'name');
        TKAssertExactEquals(b.value, "");
        a.name = "test1";
        TKAssertExactEquals(b.value, "test1");
        b.unbind('value');
        a.name = "test2";
        TKAssertExactEquals(a.name, "test2");
        TKAssertExactEquals(b.value, "test1");
    },

    testRebind: function(){
        var A = JSObject.$extend({
            name: "",
        }, "A");

        var B = JSObject.$extend({
            name: ""
        }, "B");

        var C = JSObject.$extend({
            value: null
        }, "C");

        var a = A.init();
        var b = B.init();
        var c = C.init();
        b.name = "testb";
        c.bind('value', a, 'name');
        TKAssertExactEquals(c.value, "");
        a.name = "test1";
        TKAssertExactEquals(c.value, "test1");
        c.bind('value', b, 'name');
        TKAssertExactEquals(c.value, "testb");
        a.name = "test2";
        TKAssertExactEquals(a.name, "test2");
        TKAssertExactEquals(b.name, "testb");
        TKAssertExactEquals(c.value, "testb");
        b.name = "test3";
        TKAssertExactEquals(a.name, "test2");
        TKAssertExactEquals(b.name, "test3");
        TKAssertExactEquals(c.value, "test3");
    },

    testBooleanBind: function(){
        var A = JSObject.$extend({
            first: false,
            second: false
        }, "A");

        var B = JSObject.$extend({
            value: false
        }, "B");

        var a = A.init();
        var b = B.init();
        b.bind('value', a, 'first');
        b.bind('value', a, 'second');
        TKAssertExactEquals(b.value, false);
        a.first = true;
        TKAssertExactEquals(b.value, false);
        a.second = true;
        TKAssertExactEquals(b.value, true);
        a.first = false;
        TKAssertExactEquals(b.value, false);
        b.unbind('value');
        TKAssertExactEquals(b.value, false);
        a.first = true;
        TKAssertExactEquals(b.value, false);

        a.second = false;
        a.first = false;
        b.value = true;
        TKAssertExactEquals(b.value, true);
        TKAssertExactEquals(a.first, false);
        TKAssertExactEquals(a.second, false);
        b.didChangeValueForBinding("value");
        TKAssertExactEquals(b.value, true);
        TKAssertExactEquals(a.first, false);
        TKAssertExactEquals(a.second, false);
    },

    testInitWithSpec: function(){
        var cls = JSClass("Test1", JSObject, {
            prop: JSOutlet(),
        });

        var obj = Test1.init();
        TKAssertNull(obj.prop);

        var spec = JSSpec.initWithDictionary({
            "File's Owner": "/Object",
            "Object": {
                "class": "Test1",
                "outlets": {
                    "prop": 1
                }
            }
        });
        obj = spec.filesOwner;
        TKAssertEquals(obj.prop, 1);

        spec = JSSpec.initWithDictionary({
            "File's Owner": "/Object",
            "Object": {
                "class": "Test1",
                "outlets": {
                    "other": 1
                }
            }
        });
        TKAssertThrows(function(){
            obj = spec.filesOwner;
        });
    },

    _testReadOnlyBind: function(){
    },

    _testValueTransformerBind: function(){
    },

    _testNegateBooleanKeyValueShortcut: function(){
    },

    _testIsNullKeyValueShortcut: function(){
    },

    _testIsNotNullKeyValueShortcut: function(){
    },

    _testIsEmptyKeyValueShortcut: function(){
    },

    _testIsNotEmptyKeyValueShortcut: function(){
    },

    testClassSyntaxExtend: function(){
        var test1 = class Test1 extends JSObject{
            initWithNumber(number){
                this.number = number;
            }
        };
        TKAssertThrows(function(){
            new test1();
        });
        TKAssertNotUndefined(test1.init);
        TKAssertUndefined(test1.initWithNumber);
        TKAssertUndefined(test1.$super);
        TKAssertEquals(test1.className, "JSObject");
        test1.initialize();
        TKAssertNotUndefined(test1.initWithNumber);
        TKAssertExactEquals(test1.$super, JSObject.prototype);
        var a = test1.init();
        TKAssertNotUndefined(a.objectID);
        TKAssertNotNull(a.objectID);
        TKAssertExactEquals(a.$class, test1);
        TKAssertExactEquals(test1.className, 'Test1');
        var b = test1.initWithNumber(2);
        TKAssertNotUndefined(b.objectID);
        TKAssertNotNull(b.objectID);
        TKAssertEquals(b.number, 2);
        TKAssert(a.isKindOfClass(test1));
        TKAssert(a.isKindOfClass(JSObject));
    }

});
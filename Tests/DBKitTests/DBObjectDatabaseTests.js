// #import DBKit
// #import TestKit
'use strict';

JSClass("DBObjectDatabaseTests", TKTestSuite, {

    manager: null,
    db: null,

    setup: function(){
        var timestamp = (new Date()).getTime();
        this.manager = JSFileManager.initWithIdentifier("io.breakside.JSKit.FoundationTests-%d".sprintf(timestamp));
        var expectation = TKExpectation.init();
        expectation.call(this.manager.open, this.manager, function(state){
            TKAssertExactEquals(state, JSFileManager.State.success);
            var url = this.manager.temporaryDirectoryURL.appendingPathComponent('DBObjectDatabaseTests', true);
            this.db = DBObjectDatabase.initWithURL(url, this.manager);
        }, this);
        this.wait(expectation, 1.0);
    },

    teardown: function(){
        var expectation = TKExpectation.init();
        expectation.call(this.manager.destroy, this.manager, function(success){
            TKAssert(success);
        }, this);
        this.wait(expectation, 2.0);
    },

    testId: function(){
        var id = this.db.id("testing");
        TKAssertEquals(id.length, 48);
        TKAssertEquals(id.substr(0, 8), "testing_");

        var id2 = this.db.id("testing");
        TKAssertEquals(id.length, 48);
        TKAssertEquals(id.substr(0, 8), "testing_");
        TKAssertNotEquals(id, id2);

        var data = "Hello, World!".utf8();
        id = this.db.id("test", data);
        var hash = JSSHA1Hash(data).hexStringRepresentation();
        var expected = "test_" + hash;
        TKAssertEquals(id, expected);
        id2 = this.db.id("test", data);
        TKAssertEquals(id, id2);
    },

    testSave: function(){
        var obj = {
            id: this.db.id("test"),
            one: 1,
            two: "2",
            three: null
        };
        var expectation = TKExpectation.init();
        expectation.call(this.db.saveObject, this.db, obj, function(success){
            TKAssert(success);
        });
        this.wait(expectation, 1.0);
    },

    testSavePromise: function(){
        var obj = {
            id: this.db.id("test"),
            one: 1,
            two: "2",
            three: null
        };
        var expectation = TKExpectation.init();
        var promise = this.db.saveObject(obj);
        expectation.call(promise.then, promise, function(){
        }, function(){
            TKAssert(false, "Promise rejected");
        });
        this.wait(expectation, 1.0);
    },

    testObject: function(){
        var id = this.db.id("test");
        var obj = {
            id: id,
            one: 1,
            two: "2",
            three: null
        };
        var expectation = TKExpectation.init();
        expectation.call(this.db.saveObject, this.db, obj, function(success){
            TKAssert(success);
            expectation.call(this.db.object, this.db, id, function(obj){
                TKAssertNotNull(obj);
                TKAssertEquals(obj.id, id);
                TKAssertExactEquals(obj.one, 1);
                TKAssertExactEquals(obj.two, "2");
                TKAssertNull(obj.three);
            }, this);
        }, this);
        this.wait(expectation, 1.0);
    },

    testObjectPromise: function(){
        var id = this.db.id("test");
        var obj = {
            id: id,
            one: 1,
            two: "2",
            three: null
        };
        var expectation = TKExpectation.init();
        var promise = this.db.saveObject(obj);
        var db  = this.db;
        expectation.call(promise.then, promise, function(){
            var promise = db.object(id);
            expectation.call(promise.then, promise, function(obj){
                TKAssertNotNull(obj);
                TKAssertEquals(obj.id, id);
                TKAssertExactEquals(obj.one, 1);
                TKAssertExactEquals(obj.two, "2");
                TKAssertNull(obj.three);
            }, function(){
                TKAssert(false, "Promise rejected");
            });
        }, function(){
            TKAssert(false, "Promise rejected");
        });
        this.wait(expectation, 1.0);
    },

    testMissingObject: function(){
        var id = this.db.id("test");
        var obj = {
            id: id,
            one: 1,
            two: "2",
            three: null
        };
        var expectation = TKExpectation.init();
        expectation.call(this.db.object, this.db, id, function(obj){
            TKAssertNull(obj);
        });
        this.wait(expectation, 1.0);
    },

    testDeleteObject: function(){
        var id = this.db.id("test");
        var obj = {
            id: id,
            one: 1,
            two: "2",
            three: null
        };
        var expectation = TKExpectation.init();
        expectation.call(this.db.saveObject, this.db, obj, function(success){
            TKAssert(success);
            expectation.call(this.db.object, this.db, id, function(obj){
                TKAssertNotNull(obj);
                expectation.call(this.db.deleteObject, this.db, id, function(success){
                    TKAssert(success);
                    expectation.call(this.db.object, this.db, id, function(obj){
                        TKAssertNull(obj);
                    }, this);
                }, this);
            }, this);
        }, this);
        this.wait(expectation, 1.0);
    }

});
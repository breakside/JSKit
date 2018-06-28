// #import "SecurityKit/SecurityKit.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, SECKeychain, JSFileManager, TKExpectation */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
'use strict';

JSClass("SECKeychainTests", TKTestSuite, {

    fileManager: null,
    keychain: null,

    setup: function(){
        var timestamp = (new Date()).getTime();
        this.fileManager = JSFileManager.initWithIdentifier("io.breakside.JSKit.SecurityKitTests-%d".sprintf(timestamp));
        var expectation = TKExpectation.init();
        var suite = this;
        expectation.call(this.fileManager.open, this.fileManager, function(state){
            TKAssertExactEquals(state, JSFileManager.State.success);
            suite.keychain = SECKeychain.initWithIdentifier("io.breakside.JSKit.SecurityKitTests-%d".sprintf(timestamp), suite.fileManager);
            expectation.call(suite.keychain.create, suite.keychain, "test123", function(success){
                TKAssert(success);
            });
        });
        this.wait(expectation, 2.0);
    },

    teardown: function(){
        var expectation = TKExpectation.init();
        if (this.keychain !== null){
            expectation.call(this.keychain.close, this.keychain, function(closeSuccess){
                expectation.call(this.fileManager.destroy, this.fileManager, function(success){
                    TKAssert(success && closeSuccess);
                });
            }, this);
        }else{
            expectation.call(this.fileManager.destroy, this.fileManager, function(success){
                TKAssert(success);
            });
        }
        this.wait(expectation, 1.0);
    },

    testUnlock: function(){
        var expectation = TKExpectation.init();
        this.keychain.lock();
        expectation.call(this.keychain.unlock, this.keychain, "test123", function(success){
            TKAssert(success);
        });
        this.wait(expectation, 2.0);
    },

    testUnlockFailure: function(){
        var expectation = TKExpectation.init();
        this.keychain.lock();
        expectation.call(this.keychain.unlock, this.keychain, "Test123", function(success){
            TKAssert(!success);
        });
        this.wait(expectation, 2.0);
    },

    testAddItem: function(){
        var expectation = TKExpectation.init();
        var item = {username: "test", password: "pass"};
        expectation.call(this.keychain.add, this.keychain, item, function(id){
            TKAssertNotNull(id);
        });
        this.wait(expectation, 2.0);
    },

    testGetItem: function(){
        var expectation = TKExpectation.init();
        var item = {username: "test", password: "pass"};
        expectation.call(this.keychain.add, this.keychain, item, function(id){
            TKAssertNotNull(id);
            expectation.call(this.keychain.get, this.keychain, id, function(fetchedItem){
                TKAssertNotNull(fetchedItem);
                TKAssertNotExactEquals(item, fetchedItem);
                TKAssertEquals(fetchedItem.username, "test");
                TKAssertEquals(fetchedItem.password, "pass");
                this.keychain.lock();
                expectation.call(this.keychain.get, this.keychain, id, function(fetchedItem){
                    TKAssertNull(fetchedItem);
                    expectation.call(this.keychain.unlock, this.keychain, "test123", function(success){
                        TKAssert(success);
                        expectation.call(this.keychain.get, this.keychain, id, function(fetchedItem){
                            TKAssertNotNull(fetchedItem);
                            TKAssertEquals(fetchedItem.username, "test");
                            TKAssertEquals(fetchedItem.password, "pass");
                        }, this);
                    }, this);
                }, this);
            }, this);
        }, this);
        this.wait(expectation, 2.0);
    },

    testUpdateItem: function(){
        var expectation = TKExpectation.init();
        var item = {username: "test", password: "pass"};
        expectation.call(this.keychain.add, this.keychain, item, function(id){
            TKAssertNotNull(id);
            expectation.call(this.keychain.get, this.keychain, id, function(fetchedItem){
                TKAssertNotNull(fetchedItem);
                TKAssertEquals(fetchedItem.username, "test");
                TKAssertEquals(fetchedItem.password, "pass");
                fetchedItem.password = "pass2";
                expectation.call(this.keychain.update, this.keychain, fetchedItem, function(id){
                    TKAssertNotNull(id);
                    expectation.call(this.keychain.get, this.keychain, id, function(fetchedItem){
                        TKAssertNotNull(fetchedItem);
                        TKAssertEquals(fetchedItem.username, "test");
                        TKAssertEquals(fetchedItem.password, "pass2");
                    }, this);
                }, this);
            }, this);
        }, this);
        this.wait(expectation, 2.0);
    },

    testRemoveItem: function(){
        var expectation = TKExpectation.init();
        var item = {username: "test", password: "pass"};
        expectation.call(this.keychain.add, this.keychain, item, function(id){
            TKAssertNotNull(id);
            expectation.call(this.keychain.get, this.keychain, id, function(fetchedItem){
                TKAssertNotNull(fetchedItem);
                expectation.call(this.keychain.remove, this.keychain, id, function(success){
                    TKAssert(success);
                    expectation.call(this.keychain.get, this.keychain, id, function(fetchedItem){
                        TKAssertNull(fetchedItem);
                    }, this);
                }, this);
            }, this);
        }, this);
        this.wait(expectation, 2.0);
    }

});
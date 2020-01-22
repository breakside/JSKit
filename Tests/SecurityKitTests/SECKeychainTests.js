// #import SecurityKit
// #import TestKit
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
            expectation.call(suite.keychain.initializeWithMasterPassword, suite.keychain, "test123", function(success){
                TKAssert(success);
            });
        });
        this.wait(expectation, 5.0);
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
        this.wait(expectation, 5.0);
    },

    testUnlockPromise: function(){
        var expectation = TKExpectation.init();
        this.keychain.lock();
        var promise = this.keychain.unlock("test123");
        TKAssert(promise instanceof Promise);
        expectation.call(promise.then, promise, function(){
        }, function(){
            TKAssert();
        });
        this.wait(expectation, 5.0);
    },

    testUnlockFailure: function(){
        var expectation = TKExpectation.init();
        this.keychain.lock();
        expectation.call(this.keychain.unlock, this.keychain, "Test123", function(success){
            TKAssert(!success);
        });
        this.wait(expectation, 5.0);
    },

    testUnlockFailurePromise: function(){
        var expectation = TKExpectation.init();
        this.keychain.lock();
        var promise = this.keychain.unlock("Test123");
        TKAssert(promise instanceof Promise);
        expectation.call(promise.then, promise, function(){
            TKAssert();
        }, function(){
            // expecting failure
        });
        this.wait(expectation, 5.0);
    },

    testAddItem: function(){
        var expectation = TKExpectation.init();
        var item = {username: "test", password: "pass"};
        expectation.call(this.keychain.add, this.keychain, item, function(id){
            TKAssertNotNull(id);
        });
        this.wait(expectation, 5.0);
    },

    testAddItemPromise: function(){
        var expectation = TKExpectation.init();
        var item = {username: "test", password: "pass"};
        var promise = this.keychain.add(item);
        TKAssert(promise instanceof Promise);
        expectation.call(promise.then, promise, function(id){
        }, function(){
            TKAssert();
        });
        this.wait(expectation, 5.0);
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
        this.wait(expectation, 5.0);
    },

    testGetItemPromise: function(){
        var expectation = TKExpectation.init();
        var keychain = this.keychain;
        var item = {username: "test", password: "pass"};
        var promise = keychain.add(item);
        TKAssert(promise instanceof Promise);
        expectation.call(promise.then, promise, function(id){
            var promise = keychain.get(id);
            TKAssert(promise instanceof Promise);
            expectation.call(promise.then, promise, function(fetchedItem){
                TKAssertNotExactEquals(item, fetchedItem);
                TKAssertEquals(fetchedItem.username, "test");
                TKAssertEquals(fetchedItem.password, "pass");
                keychain.lock();
                var promise = keychain.get(id);
                TKAssert(promise instanceof Promise);
                expectation.call(promise.then, promise, function(fetchedItem){
                    TKAssert();
                }, function(){
                    var promise = keychain.unlock("test123");
                    TKAssert(promise instanceof Promise);
                    expectation.call(promise.then, promise, function(success){
                        var promise = keychain.get(id);
                        TKAssert(promise instanceof Promise);
                        expectation.call(promise.then, promise, function(fetchedItem){
                            TKAssertEquals(fetchedItem.username, "test");
                            TKAssertEquals(fetchedItem.password, "pass");
                        }, function(){
                            TKAssert();
                        });
                    }, function(){
                        TKAssert();
                    });
                });
            }, function(){
                TKAssert();
            });
        }, function(){
            TKAssert();
        });
        this.wait(expectation, 5.0);
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
        this.wait(expectation, 5.0);
    },

    testUpdateItemPromise: function(){
        var expectation = TKExpectation.init();
        var keychain = this.keychain;
        var item = {username: "test", password: "pass"};
        var promise = keychain.add(item);
        TKAssert(promise instanceof Promise);
        expectation.call(promise.then, promise, function(id){
            var promise = keychain.get(id);
            TKAssert(promise instanceof Promise);
            expectation.call(promise.then, promise, function(fetchedItem){
                TKAssertEquals(fetchedItem.username, "test");
                TKAssertEquals(fetchedItem.password, "pass");
                fetchedItem.password = "pass2";
                var promise = keychain.update(fetchedItem);
                TKAssert(promise instanceof Promise);
                expectation.call(promise.then, promise, function(id){
                    var promise = keychain.get(id);
                    TKAssert(promise instanceof Promise);
                    expectation.call(promise.then, promise, function(fetchedItem){
                        TKAssertEquals(fetchedItem.username, "test");
                        TKAssertEquals(fetchedItem.password, "pass2");
                    }, function(){
                        TKAssert();
                    });
                }, function(){
                    TKAssert();
                });
            }, function(){
                TKAssert();
            });
        }, function(){
            TKAssert();
        });
        this.wait(expectation, 5.0);
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
        this.wait(expectation, 5.0);
    },

    testRemoveItemPromise: function(){
        var expectation = TKExpectation.init();
        var keychain = this.keychain;
        var item = {username: "test", password: "pass"};
        var promise = keychain.add(item);
        TKAssert(promise instanceof Promise);
        expectation.call(promise.then, promise, function(id){
            var promise = keychain.get(id);
            TKAssert(promise instanceof Promise);
            expectation.call(promise.then, promise, function(fetchedItem){
                var promise = keychain.remove(id);
                TKAssert(promise instanceof Promise);
                expectation.call(promise.then, promise, function(){
                    var promise = keychain.get(id);
                    TKAssert(promise instanceof Promise);
                    expectation.call(promise.then, promise, function(fetchedItem){
                        TKAssert();
                    }, function(){
                        // expecting rejection
                    });
                }, function(){
                    TKAssert();
                });
            }, function(){
                TKAssert();
            });
        }, function(){
            TKAssert();
        });
        this.wait(expectation, 5.0);
    },

    testChangeMasterPassword: function(){
        var expectation = TKExpectation.init();
        expectation.call(this.keychain.changeMasterPassword, this.keychain, "Test123", "test456", function(success){
            TKAssert(!success);
            expectation.call(this.keychain.changeMasterPassword, this.keychain, "test123", "test456", function(success){
                TKAssert(success);
                this.keychain.lock();
                expectation.call(this.keychain.unlock, this.keychain, "test456", function(success){
                    TKAssert(success);
                }, this);
            }, this);
        }, this);
        this.wait(expectation, 5.0);
    },

    testChangeMasterPasswordPromise: function(){
        var expectation = TKExpectation.init();
        var keychain = this.keychain;
        var promise = keychain.changeMasterPassword("Test123", "test456");
        TKAssert(promise instanceof Promise);
        expectation.call(promise.then, promise, function(){
            TKAssert();
        }, function(){
            var promise = keychain.changeMasterPassword("test123", "test456");
            TKAssert(promise instanceof Promise);
            expectation.call(promise.then, promise, function(){
                keychain.lock();
                var promise = keychain.unlock("test456");
                TKAssert(promise instanceof Promise);
                expectation.call(promise.then, promise, function(){
                }, function(){
                    TKAssert();
                });
            }, function(){
                TKAssert();
            });
        });
        this.wait(expectation, 5.0);
    }

});
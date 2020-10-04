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

JSClass("JSFileManagerTests", TKTestSuite, {

    manager: null,

    setup: function(){
        var timestamp = (new Date()).getTime();
        this.manager = JSFileManager.initWithIdentifier("io.breakside.JSKit.FoundationTests-%d".sprintf(timestamp));
        var expectation = TKExpectation.init();
        expectation.call(this.manager.open, this.manager, function(state){
            TKAssertExactEquals(state, JSFileManager.State.success);
        });
        this.wait(expectation, 2.0);
    },

    teardown: function(){
        var expectation = TKExpectation.init();
        expectation.call(this.manager.destroy, this.manager, function(success){
            TKAssert(success);
        });
        this.wait(expectation, 2.0);
    },

    testCreateDirectoryAtURL: function(){
        var manager = this.manager;
        var expectation = TKExpectation.init();
        var url = manager.temporaryDirectoryURL.appendingPathComponent('tests');
        expectation.call(manager.createDirectoryAtURL, manager, url, function(success){
            TKAssert(success);
            expectation.call(manager.itemExistsAtURL, manager, url, function(exists){
                TKAssert(exists);
            });
        });
        this.wait(expectation, 3.0);
    },

    testCreateDirectoryAtURLPromise: function(){
        var manager = this.manager;
        var expectation = TKExpectation.init();
        var url = manager.temporaryDirectoryURL.appendingPathComponent('tests');
        var promise = manager.createDirectoryAtURL(url);
        TKAssert(promise instanceof Promise);
        expectation.call(promise.then, promise, function(){
            expectation.call(manager.itemExistsAtURL, manager, url, function(exists){
                TKAssert(exists);
            });
        }, function(){
            TKAssert();
        });
        this.wait(expectation, 3.0);
    },

    testCreateDirectoryAtURL_withIntermediates: function(){
        var manager = this.manager;
        var expectation = TKExpectation.init();
        var url = manager.temporaryDirectoryURL.appendingPathComponents(['tests', 'a', 'b']);
        expectation.call(manager.createDirectoryAtURL, manager, url, function(success){
            TKAssert(success);
            expectation.call(manager.itemExistsAtURL, manager, url, function(exists){
                TKAssert(exists);
            });
        });
        this.wait(expectation, 2.0);
    },

    testItemExistsAtURL: function(){
        var manager = this.manager;
        var expectation = TKExpectation.init();
        var url = manager.temporaryDirectoryURL.appendingPathComponents(['tests', 'a', 'c']);
        expectation.call(manager.itemExistsAtURL, manager, url, function(exists){
            TKAssert(!exists);
        });
        this.wait(expectation, 2.0);
    },

    testItemExistsAtURLPromise: function(){
        var manager = this.manager;
        var expectation = TKExpectation.init();
        var url = manager.temporaryDirectoryURL.appendingPathComponents(['tests', 'a', 'c']);
        var promise = manager.itemExistsAtURL(url);
        TKAssert(promise instanceof Promise);
        expectation.call(promise.then, promise, function(exists){
            TKAssert(!exists);
        }, function(){
            TKAssert();
        });
        this.wait(expectation, 2.0);
    },

    testCreateFileAtURL: function(){
        var manager = this.manager;
        var expectation = TKExpectation.init();
        var url = manager.temporaryDirectoryURL.appendingPathComponents(['tests', 'test1.txt']);
        var txt = "This is a test!";
        expectation.call(manager.createFileAtURL, manager, url, txt.utf8(), function(success){
            TKAssert(success);
            expectation.call(manager.itemExistsAtURL, manager, url, function(exists){
                TKAssert(exists);
            });
        });
        this.wait(expectation, 2.0);
    },

    testCreateFileAtURLPromise: function(){
        var manager = this.manager;
        var expectation = TKExpectation.init();
        var url = manager.temporaryDirectoryURL.appendingPathComponents(['tests', 'test1.txt']);
        var txt = "This is a test!";
        var promise = manager.createFileAtURL(url, txt.utf8());
        TKAssert(promise instanceof Promise);
        expectation.call(promise.then, promise, function(){
            expectation.call(manager.itemExistsAtURL, manager, url, function(exists){
                TKAssert(exists);
            });
        }, function(){
            TKAssert();
        });
        this.wait(expectation, 2.0);
    },

    testCreateDirectoryAtURL_withFileParent: function(){
        var manager = this.manager;
        var expectation = TKExpectation.init();
        var url1 = manager.temporaryDirectoryURL.appendingPathComponent('test.txt');
        var url2 = url1.appendingPathComponent('test');
        var txt = "This is a test!";
        expectation.call(manager.createFileAtURL, manager, url1, txt.utf8(), function(success){
            TKAssert(success);
            expectation.call(manager.createDirectoryAtURL, manager, url2, function(success){
                TKAssert(!success);
            });
        });
        this.wait(expectation, 2.0);
    },

    testCreateFileAtURL_withFileParent: function(){
        var manager = this.manager;
        var expectation = TKExpectation.init();
        var url1 = manager.temporaryDirectoryURL.appendingPathComponent('test.txt');
        var url2 = url1.appendingPathComponent('test');
        var txt = "This is a test!";
        expectation.call(manager.createFileAtURL, manager, url1, txt.utf8(), function(success){
            TKAssert(success);
            expectation.call(manager.createFileAtURL, manager, url2, txt.utf8(), function(success){
                TKAssert(!success);
            });
        });
        this.wait(expectation, 2.0);
    },

    testContentsAtURL: function(){
        var manager = this.manager;
        var expectation = TKExpectation.init();
        var url = manager.temporaryDirectoryURL.appendingPathComponent('test1.txt');
        var txt = "This is a test!";
        expectation.call(manager.createFileAtURL, manager, url, txt.utf8(), function(success){
            TKAssert(success);
            expectation.call(manager.contentsAtURL, manager, url, function(data){
                TKAssertNotNull(data);
                var str = String.initWithData(data, String.Encoding.utf8);
                TKAssertEquals(str, "This is a test!");
            });
        });
        this.wait(expectation, 2.0);
    },

    testContentsAtURLPromise: function(){
        var manager = this.manager;
        var expectation = TKExpectation.init();
        var url = manager.temporaryDirectoryURL.appendingPathComponent('test1.txt');
        var txt = "This is a test!";
        expectation.call(manager.createFileAtURL, manager, url, txt.utf8(), function(success){
            TKAssert(success);
            var promise = manager.contentsAtURL(url);
            TKAssert(promise instanceof Promise);
            expectation.call(promise.then, promise, function(data){
                var str = String.initWithData(data, String.Encoding.utf8);
                TKAssertEquals(str, "This is a test!");
            }, function(){
                TKAssert();
            });
        });
        this.wait(expectation, 2.0);
    },

    testRemoveItemAtURL: function(){
        var manager = this.manager;
        var expectation = TKExpectation.init();
        var url = manager.temporaryDirectoryURL.appendingPathComponent('test1.txt');
        var txt = "This is a test!";
        expectation.call(manager.createFileAtURL, manager, url, txt.utf8(), function(success){
            TKAssert(success);
            expectation.call(manager.itemExistsAtURL, manager, url, function(exists){
                TKAssert(exists);
                expectation.call(manager.removeItemAtURL, manager, url, function(success){
                    TKAssertNotNull(success);
                    expectation.call(manager.itemExistsAtURL, manager, url, function(exists){
                        TKAssert(!exists);
                    });
                });
            });
        });
        this.wait(expectation, 2.0);
    },

    testRemoveItemAtURLPromise: function(){
        var manager = this.manager;
        var expectation = TKExpectation.init();
        var url = manager.temporaryDirectoryURL.appendingPathComponent('test1.txt');
        var txt = "This is a test!";
        expectation.call(manager.createFileAtURL, manager, url, txt.utf8(), function(success){
            TKAssert(success);
            expectation.call(manager.itemExistsAtURL, manager, url, function(exists){
                TKAssert(exists);
                var promise = manager.removeItemAtURL(url);
                expectation.call(promise.then, promise, function(){
                    expectation.call(manager.itemExistsAtURL, manager, url, function(exists){
                        TKAssert(!exists);
                    });
                }, function(){
                    TKAssert();
                });
            });
        });
        this.wait(expectation, 2.0);
    },

    testRemoveDirectoryAtURL: function(){
        var manager = this.manager;
        var expectation = TKExpectation.init();
        var temp = manager.temporaryDirectoryURL;
        var parent = temp.removingLastPathComponent();
        var url = temp.appendingPathComponent('test1.txt');
        var txt = "This is a test!";
        expectation.call(manager.createFileAtURL, manager, url, txt.utf8(), function(success){
            TKAssert(success);
            expectation.call(manager.itemExistsAtURL, manager, url, function(exists){
                TKAssert(exists);
                expectation.call(manager.removeItemAtURL, manager, parent, function(success){
                    TKAssertNotNull(success);
                    expectation.call(manager.itemExistsAtURL, manager, parent, function(exists){
                        TKAssert(!exists);
                    });
                });
            });
        });
        this.wait(expectation, 2.0);
    },

    testCreateSymbolicLinkAtURL: function(){
        var manager = this.manager;
        var expectation = TKExpectation.init();
        var url = manager.temporaryDirectoryURL.appendingPathComponent('test1.txt');
        var url2 = manager.temporaryDirectoryURL.appendingPathComponent('test2.txt');
        var txt = "This is a test!";
        expectation.call(manager.createFileAtURL, manager, url, txt.utf8(), function(success){
            TKAssert(success);
            expectation.call(manager.createSymbolicLinkAtURL, manager, url2, url, function(success){
                TKAssert(success);
                expectation.call(manager.contentsAtURL, manager, url2, function(data){
                    TKAssertNotNull(data);
                    var str = String.initWithData(data, String.Encoding.utf8);
                    TKAssertEquals(str, "This is a test!");
                });
            });
        });
        this.wait(expectation, 2.0);
    },

    testCreateSymbolicLinkAtURLPromise: function(){
        var manager = this.manager;
        var expectation = TKExpectation.init();
        var url = manager.temporaryDirectoryURL.appendingPathComponent('test1.txt');
        var url2 = manager.temporaryDirectoryURL.appendingPathComponent('test2.txt');
        var txt = "This is a test!";
        expectation.call(manager.createFileAtURL, manager, url, txt.utf8(), function(success){
            TKAssert(success);
            var promise = manager.createSymbolicLinkAtURL(url2, url);
            expectation.call(promise.then, promise, function(){
                expectation.call(manager.contentsAtURL, manager, url2, function(data){
                    TKAssertNotNull(data);
                    var str = String.initWithData(data, String.Encoding.utf8);
                    TKAssertEquals(str, "This is a test!");
                });
            }, function(){
                TKAssert();
            });
        });
        this.wait(expectation, 2.0);
    },

    testCreateSymbolicLinkAtURLRelative: function(){
        var manager = this.manager;
        var expectation = TKExpectation.init();
        var parentURL = manager.temporaryDirectoryURL.appendingPathComponent('test');
        var url = manager.temporaryDirectoryURL.appendingPathComponent('test.txt');
        var toURL = JSURL.initWithString("../test.txt");
        var url2 = parentURL.appendingPathComponent('test2.txt');
        var txt = "This is a test!";
        expectation.call(manager.createDirectoryAtURL, manager, parentURL, function(success){
            TKAssert(success);
            expectation.call(manager.createFileAtURL, manager, url, txt.utf8(), function(success){
                TKAssert(success);
                expectation.call(manager.createSymbolicLinkAtURL, manager, url2, toURL, function(success){
                    TKAssert(success);
                    expectation.call(manager.contentsAtURL, manager, url2, function(data){
                        TKAssertNotNull(data);
                        var str = String.initWithData(data, String.Encoding.utf8);
                        TKAssertEquals(str, "This is a test!");
                    });
                });
            });
        });
        this.wait(expectation, 2.0);
    },

    testCircularSymbolicLinkAtURL: function(){
        var manager = this.manager;
        var expectation = TKExpectation.init();
        var url1 = manager.temporaryDirectoryURL.appendingPathComponent('test1.txt');
        var url2 = manager.temporaryDirectoryURL.appendingPathComponent('test2.txt');
        var url3 = manager.temporaryDirectoryURL.appendingPathComponent('test3.txt');
        var txt = "This is a test!";
        expectation.call(manager.createFileAtURL, manager, url1, txt.utf8(), function(success){
            TKAssert(success);
            expectation.call(manager.createSymbolicLinkAtURL, manager, url2, url1, function(success){
                TKAssert(success);
                expectation.call(manager.createSymbolicLinkAtURL, manager, url3, url2, function(success){
                    TKAssert(success);
                    expectation.call(manager.removeItemAtURL, manager, url1, function(success){
                        TKAssert(success);
                        expectation.call(manager.createSymbolicLinkAtURL, manager, url1, url3, function(success){
                            TKAssert(success);
                            expectation.call(manager.contentsAtURL, manager, url2, function(data){
                                TKAssertNull(data);
                            });
                        });
                    });
                });
            });
        });
        this.wait(expectation, 2.0);
    },

    testDestinationOfSymbolicLinkAtURL: function(){
        var manager = this.manager;
        var expectation = TKExpectation.init();
        var url = manager.temporaryDirectoryURL.appendingPathComponent('test.txt');
        var url2 = manager.temporaryDirectoryURL.appendingPathComponent('test2.txt');
        var txt = "This is a test!";
        expectation.call(manager.createFileAtURL, manager, url, txt.utf8(), function(success){
            TKAssert(success);
            expectation.call(manager.createSymbolicLinkAtURL, manager, url2, url, function(success){
                TKAssert(success);
                expectation.call(manager.destinationOfSymbolicLinkAtURL, manager, url2, function(destinationURL){
                    TKAssertNotNull(destinationURL);
                    TKAssertObjectEquals(destinationURL, url);
                });
            });
        });
        this.wait(expectation, 2.0);
    },

    testDestinationOfSymbolicLinkAtURLRelative: function(){
        var manager = this.manager;
        var expectation = TKExpectation.init();
        var parentURL = manager.temporaryDirectoryURL.appendingPathComponent('test');
        var url = manager.temporaryDirectoryURL.appendingPathComponent('test.txt');
        var toURL = JSURL.initWithString("../test.txt");
        var url2 = parentURL.appendingPathComponent('test2.txt');
        var txt = "This is a test!";
        expectation.call(manager.createDirectoryAtURL, manager, parentURL, function(success){
            TKAssert(success);
            expectation.call(manager.createFileAtURL, manager, url, txt.utf8(), function(success){
                TKAssert(success);
                expectation.call(manager.createSymbolicLinkAtURL, manager, url2, toURL, function(success){
                    TKAssert(success);
                    expectation.call(manager.destinationOfSymbolicLinkAtURL, manager, url2, function(destinationURL){
                        TKAssertNotNull(destinationURL);
                        TKAssertObjectEquals(destinationURL, url);
                    });
                });
            });
        });
        this.wait(expectation, 2.0);
    },


    testContentsOfDirectory: function(){
        var manager = this.manager;
        var expectation = TKExpectation.init();
        var url = manager.temporaryDirectoryURL.appendingPathComponent('test1.txt');
        var txt = "This is a test!";
        expectation.call(manager.createFileAtURL, manager, url, txt.utf8(), function(success){
            TKAssert(success);
            var url = manager.temporaryDirectoryURL.appendingPathComponent("sub", true);
            expectation.call(manager.createDirectoryAtURL, manager, url, function(success){
                TKAssert(success);
                expectation.call(manager.contentsOfDirectoryAtURL, manager, manager.temporaryDirectoryURL, function(entries){
                    TKAssertNotNull(entries);
                    TKAssertEquals(entries.length, 2);
                    entries.sort(function(a, b){
                        if (a.name < b.name){
                            return -1;
                        }
                        if (a.name > b.name){
                            return 1;
                        }
                        return 0;
                    });
                    var url = manager.temporaryDirectoryURL.appendingPathComponent("sub", true);
                    TKAssertEquals(entries[0].name, 'sub');
                    TKAssertObjectEquals(entries[0].url, url);
                    TKAssertExactEquals(entries[0].itemType, JSFileManager.ItemType.directory);

                    url = manager.temporaryDirectoryURL.appendingPathComponent("test1.txt");
                    TKAssertEquals(entries[1].name, 'test1.txt');
                    TKAssertObjectEquals(entries[1].url, url);
                    TKAssertExactEquals(entries[1].itemType, JSFileManager.ItemType.file);
                });
            });
        });
        this.wait(expectation, 2.0);
    },

});
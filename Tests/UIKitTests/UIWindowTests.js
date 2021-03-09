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

// #import UIKit
// #import TestKit
// #import UIKitTesting
"use strict";

JSClass("UIWindowTests", TKTestSuite, {

    app: null,
    windowServer: null,

    setup: function(){
        this.windowServer = UIMockWindowServer.init();
        var bundle = JSBundle.initWithDictionary({Info: {}});
        this.app = UIApplication.initWithBundle(bundle, this.windowServer);
        JSFont.registerSystemFontDescriptor(UIMockFontDescriptor.init());
    },

    teardown: function(){
        this.app.deinit();
        this.app = null;
    },

    testInit: function(){
        var window = UIWindow.init();
        TKAssertExactEquals(window.application, this.app);
    },

    testInitWithFrame: function(){
        var window = UIWindow.initWithFrame(JSRect(0,0,100,100));
        TKAssertExactEquals(window.application, this.app);
    }

});
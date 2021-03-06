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
'use strict';

JSClass("UIWindowServerTests", TKTestSuite, {

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

    testWindowLevels: function(){
        var window1 = UIWindow.initWithApplication(this.app);
        var window2 = UIWindow.initWithApplication(this.app);
        var window3 = UIWindow.initWithApplication(this.app);
        var window4 = UIWindow.initWithApplication(this.app);
        var window5 = UIWindow.initWithApplication(this.app);
        var window6 = UIWindow.initWithApplication(this.app);
        var window7 = UIWindow.initWithApplication(this.app);
        var window8 = UIWindow.initWithApplication(this.app);
        var window9 = UIWindow.initWithApplication(this.app);

        window1.level = UIWindow.Level.back;
        window2.level = UIWindow.Level.back;
        window3.level = UIWindow.Level.back;
        window4.level = UIWindow.Level.normal;
        window5.level = UIWindow.Level.normal;
        window6.level = UIWindow.Level.normal;
        window7.level = UIWindow.Level.front;
        window8.level = UIWindow.Level.front;
        window9.level = UIWindow.Level.front;

        window1.makeKeyAndOrderFront();
        TKAssertEquals(window1.subviewIndex, 0);

        window2.makeKeyAndOrderFront();
        TKAssertEquals(window1.subviewIndex, 0);
        TKAssertEquals(window2.subviewIndex, 1);

        window4.makeKeyAndOrderFront();
        TKAssertEquals(window1.subviewIndex, 0);
        TKAssertEquals(window2.subviewIndex, 1);
        TKAssertEquals(window4.subviewIndex, 2);

        window7.makeKeyAndOrderFront();
        TKAssertEquals(window1.subviewIndex, 0);
        TKAssertEquals(window2.subviewIndex, 1);
        TKAssertEquals(window4.subviewIndex, 2);
        TKAssertEquals(window7.subviewIndex, 3);

        window5.makeKeyAndOrderFront();
        TKAssertEquals(window1.subviewIndex, 0);
        TKAssertEquals(window2.subviewIndex, 1);
        TKAssertEquals(window4.subviewIndex, 2);
        TKAssertEquals(window5.subviewIndex, 3);
        TKAssertEquals(window7.subviewIndex, 4);

        window8.makeKeyAndOrderFront();
        TKAssertEquals(window1.subviewIndex, 0);
        TKAssertEquals(window2.subviewIndex, 1);
        TKAssertEquals(window4.subviewIndex, 2);
        TKAssertEquals(window5.subviewIndex, 3);
        TKAssertEquals(window7.subviewIndex, 4);
        TKAssertEquals(window8.subviewIndex, 5);

        window3.makeKeyAndOrderFront();
        TKAssertEquals(window1.subviewIndex, 0);
        TKAssertEquals(window2.subviewIndex, 1);
        TKAssertEquals(window3.subviewIndex, 2);
        TKAssertEquals(window4.subviewIndex, 3);
        TKAssertEquals(window5.subviewIndex, 4);
        TKAssertEquals(window7.subviewIndex, 5);
        TKAssertEquals(window8.subviewIndex, 6);

        window6.makeKeyAndOrderFront();
        TKAssertEquals(window1.subviewIndex, 0);
        TKAssertEquals(window2.subviewIndex, 1);
        TKAssertEquals(window3.subviewIndex, 2);
        TKAssertEquals(window4.subviewIndex, 3);
        TKAssertEquals(window5.subviewIndex, 4);
        TKAssertEquals(window6.subviewIndex, 5);
        TKAssertEquals(window7.subviewIndex, 6);
        TKAssertEquals(window8.subviewIndex, 7);

        window9.makeKeyAndOrderFront();
        TKAssertEquals(window1.subviewIndex, 0);
        TKAssertEquals(window2.subviewIndex, 1);
        TKAssertEquals(window3.subviewIndex, 2);
        TKAssertEquals(window4.subviewIndex, 3);
        TKAssertEquals(window5.subviewIndex, 4);
        TKAssertEquals(window6.subviewIndex, 5);
        TKAssertEquals(window7.subviewIndex, 6);
        TKAssertEquals(window8.subviewIndex, 7);
        TKAssertEquals(window9.subviewIndex, 8);

        window4.orderFront();
        TKAssertEquals(window1.subviewIndex, 0);
        TKAssertEquals(window2.subviewIndex, 1);
        TKAssertEquals(window3.subviewIndex, 2);
        TKAssertEquals(window5.subviewIndex, 3);
        TKAssertEquals(window6.subviewIndex, 4);
        TKAssertEquals(window4.subviewIndex, 5);
        TKAssertEquals(window7.subviewIndex, 6);
        TKAssertEquals(window8.subviewIndex, 7);
        TKAssertEquals(window9.subviewIndex, 8);

        window4.orderFront();
        TKAssertEquals(window1.subviewIndex, 0);
        TKAssertEquals(window2.subviewIndex, 1);
        TKAssertEquals(window3.subviewIndex, 2);
        TKAssertEquals(window5.subviewIndex, 3);
        TKAssertEquals(window6.subviewIndex, 4);
        TKAssertEquals(window4.subviewIndex, 5);
        TKAssertEquals(window7.subviewIndex, 6);
        TKAssertEquals(window8.subviewIndex, 7);
        TKAssertEquals(window9.subviewIndex, 8);

        window2.orderFront();
        TKAssertEquals(window1.subviewIndex, 0);
        TKAssertEquals(window3.subviewIndex, 1);
        TKAssertEquals(window2.subviewIndex, 2);
        TKAssertEquals(window5.subviewIndex, 3);
        TKAssertEquals(window6.subviewIndex, 4);
        TKAssertEquals(window4.subviewIndex, 5);
        TKAssertEquals(window7.subviewIndex, 6);
        TKAssertEquals(window8.subviewIndex, 7);
        TKAssertEquals(window9.subviewIndex, 8);

        window7.orderFront();
        TKAssertEquals(window1.subviewIndex, 0);
        TKAssertEquals(window3.subviewIndex, 1);
        TKAssertEquals(window2.subviewIndex, 2);
        TKAssertEquals(window5.subviewIndex, 3);
        TKAssertEquals(window6.subviewIndex, 4);
        TKAssertEquals(window4.subviewIndex, 5);
        TKAssertEquals(window8.subviewIndex, 6);
        TKAssertEquals(window9.subviewIndex, 7);
        TKAssertEquals(window7.subviewIndex, 8);

        window7.orderFront();
        TKAssertEquals(window1.subviewIndex, 0);
        TKAssertEquals(window3.subviewIndex, 1);
        TKAssertEquals(window2.subviewIndex, 2);
        TKAssertEquals(window5.subviewIndex, 3);
        TKAssertEquals(window6.subviewIndex, 4);
        TKAssertEquals(window4.subviewIndex, 5);
        TKAssertEquals(window8.subviewIndex, 6);
        TKAssertEquals(window9.subviewIndex, 7);
        TKAssertEquals(window7.subviewIndex, 8);

        window2.close();
        TKAssertEquals(window1.subviewIndex, 0);
        TKAssertEquals(window3.subviewIndex, 1);
        TKAssertEquals(window5.subviewIndex, 2);
        TKAssertEquals(window6.subviewIndex, 3);
        TKAssertEquals(window4.subviewIndex, 4);
        TKAssertEquals(window8.subviewIndex, 5);
        TKAssertEquals(window9.subviewIndex, 6);
        TKAssertEquals(window7.subviewIndex, 7);

        window2.makeKeyAndOrderFront();
        TKAssertEquals(window1.subviewIndex, 0);
        TKAssertEquals(window3.subviewIndex, 1);
        TKAssertEquals(window2.subviewIndex, 2);
        TKAssertEquals(window5.subviewIndex, 3);
        TKAssertEquals(window6.subviewIndex, 4);
        TKAssertEquals(window4.subviewIndex, 5);
        TKAssertEquals(window8.subviewIndex, 6);
        TKAssertEquals(window9.subviewIndex, 7);
        TKAssertEquals(window7.subviewIndex, 8);

        window2.close();
        TKAssertEquals(window1.subviewIndex, 0);
        TKAssertEquals(window3.subviewIndex, 1);
        TKAssertEquals(window5.subviewIndex, 2);
        TKAssertEquals(window6.subviewIndex, 3);
        TKAssertEquals(window4.subviewIndex, 4);
        TKAssertEquals(window8.subviewIndex, 5);
        TKAssertEquals(window9.subviewIndex, 6);
        TKAssertEquals(window7.subviewIndex, 7);

        window5.close();
        TKAssertEquals(window1.subviewIndex, 0);
        TKAssertEquals(window3.subviewIndex, 1);
        TKAssertEquals(window6.subviewIndex, 2);
        TKAssertEquals(window4.subviewIndex, 3);
        TKAssertEquals(window8.subviewIndex, 4);
        TKAssertEquals(window9.subviewIndex, 5);
        TKAssertEquals(window7.subviewIndex, 6);

        window5.makeKeyAndOrderFront();
        TKAssertEquals(window1.subviewIndex, 0);
        TKAssertEquals(window3.subviewIndex, 1);
        TKAssertEquals(window6.subviewIndex, 2);
        TKAssertEquals(window4.subviewIndex, 3);
        TKAssertEquals(window5.subviewIndex, 4);
        TKAssertEquals(window8.subviewIndex, 5);
        TKAssertEquals(window9.subviewIndex, 6);
        TKAssertEquals(window7.subviewIndex, 7);

        window8.close();
        TKAssertEquals(window1.subviewIndex, 0);
        TKAssertEquals(window3.subviewIndex, 1);
        TKAssertEquals(window6.subviewIndex, 2);
        TKAssertEquals(window4.subviewIndex, 3);
        TKAssertEquals(window5.subviewIndex, 4);
        TKAssertEquals(window9.subviewIndex, 5);
        TKAssertEquals(window7.subviewIndex, 6);

        window9.close();
        TKAssertEquals(window1.subviewIndex, 0);
        TKAssertEquals(window3.subviewIndex, 1);
        TKAssertEquals(window6.subviewIndex, 2);
        TKAssertEquals(window4.subviewIndex, 3);
        TKAssertEquals(window5.subviewIndex, 4);
        TKAssertEquals(window7.subviewIndex, 5);

        window3.close();
        TKAssertEquals(window1.subviewIndex, 0);
        TKAssertEquals(window6.subviewIndex, 1);
        TKAssertEquals(window4.subviewIndex, 2);
        TKAssertEquals(window5.subviewIndex, 3);
        TKAssertEquals(window7.subviewIndex, 4);

        window5.close();
        TKAssertEquals(window1.subviewIndex, 0);
        TKAssertEquals(window6.subviewIndex, 1);
        TKAssertEquals(window4.subviewIndex, 2);
        TKAssertEquals(window7.subviewIndex, 3);

        window4.close();
        TKAssertEquals(window1.subviewIndex, 0);
        TKAssertEquals(window6.subviewIndex, 1);
        TKAssertEquals(window7.subviewIndex, 2);

        window6.close();
        TKAssertEquals(window1.subviewIndex, 0);
        TKAssertEquals(window7.subviewIndex, 1);

        window4.makeKeyAndOrderFront();
        TKAssertEquals(window1.subviewIndex, 0);
        TKAssertEquals(window4.subviewIndex, 1);
        TKAssertEquals(window7.subviewIndex, 2);

        window1.close();
        TKAssertEquals(window4.subviewIndex, 0);
        TKAssertEquals(window7.subviewIndex, 1);

        window4.close();
        TKAssertEquals(window7.subviewIndex, 0);

        window7.close();
        window4.makeKeyAndOrderFront();
        TKAssertEquals(window4.subviewIndex, 0);
        window4.close();
    }

});
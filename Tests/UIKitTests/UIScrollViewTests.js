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

JSClass("UIScrollViewTests", TKTestSuite, {

    windowServer: null,

    setup: function(){
        this.windowServer = UIMockWindowServer.init();
    },

    teardown: function(){
        this.windowServer = null;
    },

    testContentSize: function(){
        var view = UIScrollView.initWithFrame(JSRect(0,0,100,200));
        TKAssertExactEquals(view.contentSize.width, 0);
        TKAssertExactEquals(view.contentSize.height, 0);

        view.contentSize = JSSize(200, 300);
        TKAssertExactEquals(view.contentSize.width, 200);
        TKAssertExactEquals(view.contentSize.height, 300);
    },

    testContentOffset: function(){
        var view = UIScrollView.initWithFrame(JSRect(0,0,100,200));
        TKAssertExactEquals(view.contentOffset.x, 0);
        TKAssertExactEquals(view.contentOffset.y, 0);

        view.contentSize = JSSize(200, 300);
        TKAssertExactEquals(view.contentOffset.x, 0);
        TKAssertExactEquals(view.contentOffset.y, 0);

        view.contentOffset = JSPoint(10, 20);
        TKAssertExactEquals(view.contentOffset.x, 10);
        TKAssertExactEquals(view.contentOffset.y, 20);

        view.contentOffset = JSPoint(200, 300);
        TKAssertExactEquals(view.contentOffset.x, 100);
        TKAssertExactEquals(view.contentOffset.y, 100);

        view.contentSize = JSSize(150, 275);
        TKAssertExactEquals(view.contentOffset.x, 50);
        TKAssertExactEquals(view.contentOffset.y, 75);
    },

    testContentInsets: function(){
        var view = UIScrollView.initWithFrame(JSRect(0,0,100,200));
        view.contentSize = JSSize(200, 300);
        view.contentInsets = JSInsets(20, 30);
        TKAssertExactEquals(view.contentOffset.x, -30);
        TKAssertExactEquals(view.contentOffset.y, -20);

        view.contentOffset = JSPoint(200, 300);
        TKAssertExactEquals(view.contentOffset.x, 130);
        TKAssertExactEquals(view.contentOffset.y, 120);
    },

    testScrollToRectVertically: function(){
        var view = UIScrollView.initWithFrame(JSRect(0,0,100,100));
        view.contentSize = JSSize(100, 800);

        TKAssertExactEquals(view.contentOffset.x, 0);
        TKAssertExactEquals(view.contentOffset.y, 0);

        view.scrollToRect(JSRect(0, 90, 100, 20));
        TKAssertExactEquals(view.contentOffset.x, 0);
        TKAssertExactEquals(view.contentOffset.y, 10);

        view.scrollToRect(JSRect(0, 5, 100, 20));
        TKAssertExactEquals(view.contentOffset.x, 0);
        TKAssertExactEquals(view.contentOffset.y, 5);

        view.scrollToRect(JSRect(0, 120, 100, 20), UIScrollView.ScrollPosition.middle);
        TKAssertExactEquals(view.contentOffset.x, 0);
        TKAssertExactEquals(view.contentOffset.y, 80);

        view.contentInsets = JSInsets(17, 0);
        view.contentOffset = JSPoint(0, -17);

        TKAssertExactEquals(view.contentOffset.x, 0);
        TKAssertExactEquals(view.contentOffset.y, -17);

        view.scrollToRect(JSRect(0, 90, 100, 20));
        TKAssertExactEquals(view.contentOffset.x, 0);
        TKAssertExactEquals(view.contentOffset.y, 10);

        view.scrollToRect(JSRect(0, 5, 100, 20));
        TKAssertExactEquals(view.contentOffset.x, 0);
        TKAssertExactEquals(view.contentOffset.y, -12);

        view.scrollToRect(JSRect(0, 120, 100, 20), UIScrollView.ScrollPosition.middle);
        TKAssertExactEquals(view.contentOffset.x, 0);
        TKAssertExactEquals(view.contentOffset.y, 80);
    },

    testScrollToRectHorizontally: function(){
        var view = UIScrollView.initWithFrame(JSRect(0,0,100,100));
        view.contentSize = JSSize(800, 100);

        TKAssertExactEquals(view.contentOffset.x, 0);
        TKAssertExactEquals(view.contentOffset.y, 0);

        view.scrollToRect(JSRect(90, 0, 20, 100));
        TKAssertExactEquals(view.contentOffset.x, 10);
        TKAssertExactEquals(view.contentOffset.y, 0);

        view.scrollToRect(JSRect(5, 0, 20, 100));
        TKAssertExactEquals(view.contentOffset.x, 5);
        TKAssertExactEquals(view.contentOffset.y, 0);

        view.scrollToRect(JSRect(120, 0, 20, 100), UIScrollView.ScrollPosition.middle);
        TKAssertExactEquals(view.contentOffset.x, 80);
        TKAssertExactEquals(view.contentOffset.y, 0);

        view.contentInsets = JSInsets(0, 17);
        view.contentOffset = JSPoint(-17, 0);

        TKAssertExactEquals(view.contentOffset.x, -17);
        TKAssertExactEquals(view.contentOffset.y, 0);

        view.scrollToRect(JSRect(90, 0, 20, 100));
        TKAssertExactEquals(view.contentOffset.x, 10);
        TKAssertExactEquals(view.contentOffset.y, 0);

        view.scrollToRect(JSRect(5, 0, 20, 100));
        TKAssertExactEquals(view.contentOffset.x, -12);
        TKAssertExactEquals(view.contentOffset.y, 0);

        view.scrollToRect(JSRect(120, 0, 20, 100), UIScrollView.ScrollPosition.middle);
        TKAssertExactEquals(view.contentOffset.x, 80);
        TKAssertExactEquals(view.contentOffset.y, 0);
    }

    // TODO: zooming
    // TODO: indicators

});
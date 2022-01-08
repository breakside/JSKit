// // Copyright 2022 Breakside Inc.
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
"use strict";

JSClass("UICollectionViewTests", TKTestSuite, {

    testInit: function(){
        TKAssertThrows(function(){
            var collectionView = UICollectionView.init();
        });
    },

    testInitWithLayout: function(){
        var layout = UICollectionViewGridLayout.init();
        var collectionView = UICollectionView.initWithLayout(layout);
        TKAssertExactEquals(collectionView.collectionViewLayout, layout);
    },

    testInitWithSpec: function(){
        var spec = JSSpec.initWithDictionary({});
        TKAssertThrows(function(){
            var collectionView = UICollectionView.initWithSpec(spec);
        });

        spec = JSSpec.initWithDictionary({
            layout: {
                class: "UICollectionViewGridLayout"
            }
        });
        var collectionView = UICollectionView.initWithSpec(spec);
        TKAssertInstance(collectionView.collectionViewLayout, UICollectionViewGridLayout);
        TKAssertExactEquals(collectionView.allowsMultipleSelection, false);
        TKAssertExactEquals(collectionView.allowsEmptySelection, true);
        TKAssertExactEquals(collectionView.showsFocusRing, false);

        spec = JSSpec.initWithDictionary({
            Controller: {
                class: "UIViewController"
            },
            CollectionView: {
                class: "UICollectionView",
                layout: {
                    class: "UICollectionViewGridLayout"
                },
                delegate: "/Controller",
                dataSource: "/Controller"
            },
        });
        collectionView = spec.valueForKey("CollectionView");
        TKAssertInstance(collectionView.collectionViewLayout, UICollectionViewGridLayout);
        TKAssertInstance(collectionView.delegate, UIViewController);
        TKAssertInstance(collectionView.dataSource, UIViewController);

        spec = JSSpec.initWithDictionary({
            layout: {
                class: "UICollectionViewGridLayout"
            },
            allowsEmptySelection: false,
            allowsMultipleSelection: true,
            showsFocusRing: true
        });
        collectionView = UICollectionView.initWithSpec(spec);
        TKAssertInstance(collectionView.collectionViewLayout, UICollectionViewGridLayout);
        TKAssertExactEquals(collectionView.allowsMultipleSelection, true);
        TKAssertExactEquals(collectionView.allowsEmptySelection, false);
        TKAssertExactEquals(collectionView.showsFocusRing, true);

        spec = JSSpec.initWithDictionary({
            layout: {
                class: "UICollectionViewGridLayout"
            },
            reusableCellClasses: {
                test: "UICollectionViewTestsCell"
            },
            reusableViewClasses: {
                testing: "UICollectionViewTestsResuableView"
            }
        });
        collectionView = UICollectionView.initWithSpec(spec);
        var cell = collectionView.dequeueReusableCellWithIdentifier("test");
        TKAssertInstance(cell, UICollectionViewTestsCell);
        var view = collectionView.dequeueReusableViewWithIdentifier("testing");
        TKAssertInstance(view, UICollectionViewTestsResuableView);
    },

});

JSClass("UICollectionViewTestsCell", UICollectionViewCell, {

});

JSClass("UICollectionViewTestsResuableView", UICollectionReusableView, {

});
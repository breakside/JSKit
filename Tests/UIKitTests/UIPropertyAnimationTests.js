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
'use strict';

JSClass("UIPropertyAnimationTests", TKTestSuite, {

    testConstructor: function(){
        var animation = UIPropertyAnimation.initWithKeyPath('test');
        TKAssertEquals(animation.keyPath, 'test');
        animation = UIPropertyAnimation.initWithKeyPath('test.key.path');
        TKAssertEquals(animation.keyPath, 'test.key.path');
    },

    testLayer: function(){
        var layer = UILayer.init();
        var animation = UIPropertyAnimation.initWithKeyPath('frame');
        animation.layer = layer;
        TKAssertExactEquals(animation.layer, layer);
        TKAssertExactEquals(animation.updateContext, layer.presentation);
        TKAssertEquals(animation.updateProperty, 'frame');

        animation = UIPropertyAnimation.initWithKeyPath('frame.size.width');
        animation.layer = layer;
        TKAssertExactEquals(animation.layer, layer);
        TKAssertExactEquals(animation.updateContext, layer.presentation.frame.size);
        TKAssertEquals(animation.updateProperty, 'width');

        animation.layer = null;
        TKAssertNull(animation.layer);
        TKAssertNull(animation.updateContext);
        TKAssertNull(animation.updateProperty);
    }

});
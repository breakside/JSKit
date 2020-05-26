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
// #import "MockWindowServer.js"
'use strict';

JSClass("UIViewTests", TKTestSuite, {

    windowServer: null,

    setup: function(){
        this.windowServer = MockWindowServer.init();
    },

    teardown: function(){
        this.windowServer = null;
    },

    testBottomAnchor: function(){
        var superview = UIView.initWithFrame(JSRect(0, 0, 500, 500));
        var view1 = UIView.init();
        superview.addSubview(view1);

        var constraint = view1.bottomAnchor.constraintEqualTo(superview.bottomAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.bottom);

        constraint = view1.bottomAnchor.constraintEqualTo(superview.topAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.bottom);

        constraint = view1.bottomAnchor.constraintEqualTo(superview.firstBaselineAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.bottom);

        constraint = view1.bottomAnchor.constraintEqualTo(superview.lastBaselineAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.bottom);

        constraint = view1.bottomAnchor.constraintEqualTo(superview.centerYAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.bottom);

        TKAssertThrows(function(){
            var constraint = view1.bottomAnchor.constraintEqualTo(superview.leftAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.bottomAnchor.constraintEqualTo(superview.rightAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.bottomAnchor.constraintEqualTo(superview.centerXAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.bottomAnchor.constraintEqualTo(superview.leadingAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.bottomAnchor.constraintEqualTo(superview.trailingAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.bottomAnchor.constraintEqualTo(superview.widthAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.bottomAnchor.constraintEqualTo(superview.heightAnchor);
        });
    },

    testTopAnchor: function(){
        var superview = UIView.initWithFrame(JSRect(0, 0, 500, 500));
        var view1 = UIView.init();
        superview.addSubview(view1);

        var constraint = view1.topAnchor.constraintEqualTo(superview.bottomAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.top);

        constraint = view1.topAnchor.constraintEqualTo(superview.topAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.top);

        constraint = view1.topAnchor.constraintEqualTo(superview.firstBaselineAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.top);

        constraint = view1.topAnchor.constraintEqualTo(superview.lastBaselineAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.top);

        constraint = view1.topAnchor.constraintEqualTo(superview.centerYAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.top);

        TKAssertThrows(function(){
            var constraint = view1.topAnchor.constraintEqualTo(superview.leftAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.topAnchor.constraintEqualTo(superview.rightAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.topAnchor.constraintEqualTo(superview.centerXAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.topAnchor.constraintEqualTo(superview.leadingAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.topAnchor.constraintEqualTo(superview.trailingAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.topAnchor.constraintEqualTo(superview.widthAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.topAnchor.constraintEqualTo(superview.heightAnchor);
        });
    },

    testCenterYAnchor: function(){
        var superview = UIView.initWithFrame(JSRect(0, 0, 500, 500));
        var view1 = UIView.init();
        superview.addSubview(view1);

        var constraint = view1.centerYAnchor.constraintEqualTo(superview.bottomAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.centerY);

        constraint = view1.centerYAnchor.constraintEqualTo(superview.topAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.centerY);

        constraint = view1.centerYAnchor.constraintEqualTo(superview.firstBaselineAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.centerY);

        constraint = view1.centerYAnchor.constraintEqualTo(superview.lastBaselineAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.centerY);

        constraint = view1.centerYAnchor.constraintEqualTo(superview.centerYAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.centerY);

        TKAssertThrows(function(){
            var constraint = view1.centerYAnchor.constraintEqualTo(superview.leftAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.centerYAnchor.constraintEqualTo(superview.rightAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.centerYAnchor.constraintEqualTo(superview.centerXAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.centerYAnchor.constraintEqualTo(superview.leadingAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.centerYAnchor.constraintEqualTo(superview.trailingAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.centerYAnchor.constraintEqualTo(superview.widthAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.centerYAnchor.constraintEqualTo(superview.heightAnchor);
        });
    },

    testFirstBaselineAnchor: function(){
        var superview = UIView.initWithFrame(JSRect(0, 0, 500, 500));
        var view1 = UIView.init();
        superview.addSubview(view1);

        var constraint = view1.firstBaselineAnchor.constraintEqualTo(superview.bottomAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.firstBaseline);

        constraint = view1.firstBaselineAnchor.constraintEqualTo(superview.topAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.firstBaseline);

        constraint = view1.firstBaselineAnchor.constraintEqualTo(superview.firstBaselineAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.firstBaseline);

        constraint = view1.firstBaselineAnchor.constraintEqualTo(superview.lastBaselineAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.firstBaseline);

        constraint = view1.firstBaselineAnchor.constraintEqualTo(superview.centerYAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.firstBaseline);

        TKAssertThrows(function(){
            var constraint = view1.firstBaselineAnchor.constraintEqualTo(superview.leftAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.firstBaselineAnchor.constraintEqualTo(superview.rightAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.firstBaselineAnchor.constraintEqualTo(superview.centerXAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.firstBaselineAnchor.constraintEqualTo(superview.leadingAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.firstBaselineAnchor.constraintEqualTo(superview.trailingAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.firstBaselineAnchor.constraintEqualTo(superview.widthAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.firstBaselineAnchor.constraintEqualTo(superview.heightAnchor);
        });
    },

    testLastBaselineAnchor: function(){
        var superview = UIView.initWithFrame(JSRect(0, 0, 500, 500));
        var view1 = UIView.init();
        superview.addSubview(view1);

        var constraint = view1.lastBaselineAnchor.constraintEqualTo(superview.bottomAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.lastBaseline);

        constraint = view1.lastBaselineAnchor.constraintEqualTo(superview.topAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.lastBaseline);

        constraint = view1.lastBaselineAnchor.constraintEqualTo(superview.firstBaselineAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.lastBaseline);

        constraint = view1.lastBaselineAnchor.constraintEqualTo(superview.lastBaselineAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.lastBaseline);

        constraint = view1.lastBaselineAnchor.constraintEqualTo(superview.centerYAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.lastBaseline);

        TKAssertThrows(function(){
            var constraint = view1.lastBaselineAnchor.constraintEqualTo(superview.leftAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.lastBaselineAnchor.constraintEqualTo(superview.rightAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.lastBaselineAnchor.constraintEqualTo(superview.centerXAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.lastBaselineAnchor.constraintEqualTo(superview.leadingAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.lastBaselineAnchor.constraintEqualTo(superview.trailingAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.lastBaselineAnchor.constraintEqualTo(superview.widthAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.lastBaselineAnchor.constraintEqualTo(superview.heightAnchor);
        });
    },

    testLeftAnchor: function(){
        var superview = UIView.initWithFrame(JSRect(0, 0, 500, 500));
        var view1 = UIView.init();
        superview.addSubview(view1);

        var constraint = view1.leftAnchor.constraintEqualTo(superview.leftAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.left);

        constraint = view1.leftAnchor.constraintEqualTo(superview.rightAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.left);

        constraint = view1.leftAnchor.constraintEqualTo(superview.leadingAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.left);

        constraint = view1.leftAnchor.constraintEqualTo(superview.trailingAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.left);

        constraint = view1.leftAnchor.constraintEqualTo(superview.centerXAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.left);

        TKAssertThrows(function(){
            var constraint = view1.leftAnchor.constraintEqualTo(superview.topAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.leftAnchor.constraintEqualTo(superview.bottomAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.leftAnchor.constraintEqualTo(superview.centerYAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.leftAnchor.constraintEqualTo(superview.firstBaselineAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.leftAnchor.constraintEqualTo(superview.lastBaselineAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.leftAnchor.constraintEqualTo(superview.widthAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.leftAnchor.constraintEqualTo(superview.heightAnchor);
        });
    },

    testRightAnchor: function(){
        var superview = UIView.initWithFrame(JSRect(0, 0, 500, 500));
        var view1 = UIView.init();
        superview.addSubview(view1);

        var constraint = view1.rightAnchor.constraintEqualTo(superview.leftAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.right);

        constraint = view1.rightAnchor.constraintEqualTo(superview.rightAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.right);

        constraint = view1.rightAnchor.constraintEqualTo(superview.leadingAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.right);

        constraint = view1.rightAnchor.constraintEqualTo(superview.trailingAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.right);

        constraint = view1.rightAnchor.constraintEqualTo(superview.centerXAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.right);

        TKAssertThrows(function(){
            var constraint = view1.rightAnchor.constraintEqualTo(superview.topAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.rightAnchor.constraintEqualTo(superview.bottomAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.rightAnchor.constraintEqualTo(superview.centerYAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.rightAnchor.constraintEqualTo(superview.firstBaselineAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.rightAnchor.constraintEqualTo(superview.lastBaselineAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.rightAnchor.constraintEqualTo(superview.widthAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.rightAnchor.constraintEqualTo(superview.heightAnchor);
        });
    },

    testLeadingAnchor: function(){
        var superview = UIView.initWithFrame(JSRect(0, 0, 500, 500));
        var view1 = UIView.init();
        superview.addSubview(view1);

        var constraint = view1.leadingAnchor.constraintEqualTo(superview.leftAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.leading);

        constraint = view1.leadingAnchor.constraintEqualTo(superview.rightAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.leading);

        constraint = view1.leadingAnchor.constraintEqualTo(superview.leadingAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.leading);

        constraint = view1.leadingAnchor.constraintEqualTo(superview.trailingAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.leading);

        constraint = view1.leadingAnchor.constraintEqualTo(superview.centerXAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.leading);

        TKAssertThrows(function(){
            var constraint = view1.leadingAnchor.constraintEqualTo(superview.topAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.leadingAnchor.constraintEqualTo(superview.bottomAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.leadingAnchor.constraintEqualTo(superview.centerYAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.leadingAnchor.constraintEqualTo(superview.firstBaselineAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.leadingAnchor.constraintEqualTo(superview.lastBaselineAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.leadingAnchor.constraintEqualTo(superview.widthAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.leadingAnchor.constraintEqualTo(superview.heightAnchor);
        });
    },

    testTrailingAnchor: function(){
        var superview = UIView.initWithFrame(JSRect(0, 0, 500, 500));
        var view1 = UIView.init();
        superview.addSubview(view1);

        var constraint = view1.trailingAnchor.constraintEqualTo(superview.leftAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.trailing);

        constraint = view1.trailingAnchor.constraintEqualTo(superview.rightAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.trailing);

        constraint = view1.trailingAnchor.constraintEqualTo(superview.leadingAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.trailing);

        constraint = view1.trailingAnchor.constraintEqualTo(superview.trailingAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.trailing);

        constraint = view1.trailingAnchor.constraintEqualTo(superview.centerXAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.trailing);

        TKAssertThrows(function(){
            var constraint = view1.trailingAnchor.constraintEqualTo(superview.topAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.trailingAnchor.constraintEqualTo(superview.bottomAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.trailingAnchor.constraintEqualTo(superview.centerYAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.trailingAnchor.constraintEqualTo(superview.firstBaselineAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.trailingAnchor.constraintEqualTo(superview.lastBaselineAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.trailingAnchor.constraintEqualTo(superview.widthAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.trailingAnchor.constraintEqualTo(superview.heightAnchor);
        });
    },

    testCenterXAnchor: function(){
        var superview = UIView.initWithFrame(JSRect(0, 0, 500, 500));
        var view1 = UIView.init();
        superview.addSubview(view1);

        var constraint = view1.centerXAnchor.constraintEqualTo(superview.leftAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.centerX);

        constraint = view1.centerXAnchor.constraintEqualTo(superview.rightAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.centerX);

        constraint = view1.centerXAnchor.constraintEqualTo(superview.leadingAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.centerX);

        constraint = view1.centerXAnchor.constraintEqualTo(superview.trailingAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.centerX);

        constraint = view1.centerXAnchor.constraintEqualTo(superview.centerXAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.centerX);

        TKAssertThrows(function(){
            var constraint = view1.centerXAnchor.constraintEqualTo(superview.topAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.centerXAnchor.constraintEqualTo(superview.bottomAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.centerXAnchor.constraintEqualTo(superview.centerYAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.centerXAnchor.constraintEqualTo(superview.firstBaselineAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.centerXAnchor.constraintEqualTo(superview.lastBaselineAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.centerXAnchor.constraintEqualTo(superview.widthAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.centerXAnchor.constraintEqualTo(superview.heightAnchor);
        });
    },

    testWidthAnchor: function(){
        var superview = UIView.initWithFrame(JSRect(0, 0, 500, 500));
        var view1 = UIView.init();
        superview.addSubview(view1);

        var constraint = view1.widthAnchor.constraintEqualTo(superview.widthAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.width);

        constraint = view1.widthAnchor.constraintEqualTo(superview.heightAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.width);

        TKAssertThrows(function(){
            var constraint = view1.widthAnchor.constraintEqualTo(superview.leftAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.widthAnchor.constraintEqualTo(superview.rightAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.widthAnchor.constraintEqualTo(superview.leadingAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.widthAnchor.constraintEqualTo(superview.trailingAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.widthAnchor.constraintEqualTo(superview.centerXAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.widthAnchor.constraintEqualTo(superview.topAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.widthAnchor.constraintEqualTo(superview.bottomAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.widthAnchor.constraintEqualTo(superview.centerYAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.widthAnchor.constraintEqualTo(superview.firstBaselineAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.widthAnchor.constraintEqualTo(superview.lastBaselineAnchor);
        });
    },

    testHeightAnchor: function(){
        var superview = UIView.initWithFrame(JSRect(0, 0, 500, 500));
        var view1 = UIView.init();
        superview.addSubview(view1);

        var constraint = view1.heightAnchor.constraintEqualTo(superview.widthAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.height);

        constraint = view1.heightAnchor.constraintEqualTo(superview.heightAnchor);
        TKAssertNotNull(constraint);
        TKAssertExactEquals(constraint.firstItem, view1);
        TKAssertExactEquals(constraint.firstAttribute, UILayoutAttribute.height);

        TKAssertThrows(function(){
            var constraint = view1.heightAnchor.constraintEqualTo(superview.leftAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.heightAnchor.constraintEqualTo(superview.rightAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.heightAnchor.constraintEqualTo(superview.leadingAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.heightAnchor.constraintEqualTo(superview.trailingAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.heightAnchor.constraintEqualTo(superview.centerXAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.heightAnchor.constraintEqualTo(superview.topAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.heightAnchor.constraintEqualTo(superview.bottomAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.heightAnchor.constraintEqualTo(superview.centerYAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.heightAnchor.constraintEqualTo(superview.firstBaselineAnchor);
        });
        TKAssertThrows(function(){
            var constraint = view1.heightAnchor.constraintEqualTo(superview.lastBaselineAnchor);
        });
    }

});
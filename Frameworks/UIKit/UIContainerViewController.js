// Copyright 2021 Breakside Inc.
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

// #import "UIViewController.js"
// #import "UIContainerView.js"
'use strict';

JSClass("UIContainerViewController", UIViewController, {

    _defaultViewClass: UIContainerView,

    initWithSpec: function(spec){
        UIContainerViewController.$super.initWithSpec.call(this, spec);
        if (spec.containsKey("contentViewController")){
            this.contentViewController = spec.valueForKey("contentViewController");
        }
    },

    containerView: JSReadOnlyProperty(),

    getContainerView: function(){
        return this.view;
    },

    // MARK: - View Lifecycle

    viewDidLoad: function(){
        UIContainerViewController.$super.viewDidLoad.call(this);
        if (this._contentViewController !== null){
            this.view.contentView = this._contentViewController.view;
        }
    },

    viewWillAppear: function(animated){
        UIContainerViewController.$super.viewWillAppear.call(this, animated);
        if (this._contentViewController !== null){
            this._contentViewController.viewWillAppear(animated);
        }
    },

    viewDidAppear: function(animated){
        UIContainerViewController.$super.viewDidAppear.call(this, animated);
        if (this._contentViewController !== null){
            this._contentViewController.viewDidAppear(animated);
        }
    },

    viewWillDisappear: function(animated){
        UIContainerViewController.$super.viewWillDisappear.call(this, animated);
        if (this._contentViewController !== null){
            this._contentViewController.viewWillDisappear(animated);
        }
    },

    viewDidDisappear: function(animated){
        UIContainerViewController.$super.viewDidDisappear.call(this, animated);
        if (this._contentViewController !== null){
            this._contentViewController.viewDidDisappear(animated);
        }
    },

    contentViewController: JSDynamicProperty("_contentViewController", null),

    setContentViewController: function(contentViewController){
        var previousViewController = this._contentViewController;
        if (this.isViewLoaded){
            var contentView = null;
            if (contentViewController !== null){
                contentView = contentViewController.view;
            }
            if (this.isViewVisible){
                if (previousViewController !== null){
                    previousViewController.viewWillDisappear(false);
                }
                if (contentViewController !== null){
                    contentViewController.viewWillAppear(false);
                }
            }
            if (previousViewController !== null){
                previousViewController.removeFromParentViewController();
            }
            this._contentViewController = contentViewController;
            if (contentViewController !== null){
                this.addChildViewController(contentViewController);
            }
            this.view.contentView = contentView;
            if (this.isViewVisible){
                if (previousViewController !== null){
                    previousViewController.enqueueDidDisappear();
                }
                if (contentViewController !== null){
                    contentViewController.enqueueDidAppear();
                }
            }
        }else{
            if (previousViewController !== null){
                previousViewController.removeFromParentViewController();
            }
            this._contentViewController = contentViewController;
            if (contentViewController !== null){
                this.addChildViewController(contentViewController);
            }
        }
    },

});
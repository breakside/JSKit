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

// #import "UIViewController.js"
// #import "UIWindow.js"
'use strict';

JSClass("UIWindowController", UIViewController, {

    _defaultViewClass: UIWindow,
    _viewKeyInSpec: "window",
    delegate: null,
    autoPositionWindow: true,

    initWithSpec: function(spec){
        UIWindowController.$super.initWithSpec.call(this, spec);
        if (spec.containsKey('delegate')){
            this.delegate = spec.valueForKey('delegate');
        }
    },

    viewWillAppear: function(animated){
        UIWindowController.$super.viewWillAppear.call(this, animated);
        if (this.window.contentViewController){
            this.window.contentViewController.viewWillAppear(animated);
        }
    },

    viewDidAppear: function(animated){
        UIWindowController.$super.viewDidAppear.call(this, animated);
        if (this.window.contentViewController){
            this.window.contentViewController.viewDidAppear(animated);
        }
    },

    viewWillDisappear: function(animated){
        UIWindowController.$super.viewWillDisappear.call(this, animated);
        if (this.window.contentViewController){
            this.window.contentViewController.viewWillDisappear(animated);
        }
        if (this.delegate && this.delegate.windowControllerWillClose){
            this.delegate.windowControllerWillClose(this);
        }
    },

    viewDidDisappear: function(animated){
        UIWindowController.$super.viewDidDisappear.call(this, animated);
        if (this.window.contentViewController){
            this.window.contentViewController.viewDidDisappear(animated);
        }
        if (this.delegate && this.delegate.windowControllerDidClose){
            this.delegate.windowControllerDidClose(this);
        }
        this.unloadView();
    },

    contentSizeThatFitsSize: function(size){
        var contentSize;
        if (this.window.contentViewController){
            contentSize = this.window.contentViewController.contentSizeThatFitsSize(size);
        }else{
            this.window.contentView.sizeToFitSize(size);
            contentSize = JSSize(this.window.contentView.frame.size);
        }
        return contentSize;
    },

    getWindow: function(){
        return this.view;
    },

    getNextResponder: function(){
        return this._view._application;
    },

    orderFront: function(){
        this.prepareWindowIfNeeded();
        this.window.orderFront();
    },

    open: function(){
        this.orderFront();
    },

    makeKeyAndOrderFront: function(){
        this.prepareWindowIfNeeded();
        this.window.makeKeyAndOrderFront();
    },

    _needsPrepare: true,

    prepareWindowIfNeeded: function(){
        if (this._needsPrepare){
            this._prepareWindow();
            this._needsPrepare = false;
        }
    },

    _prepareWindow: function(){
        if (this.autoPositionWindow){
            this.window.sizeToFit();
            if (!this.window.isUsingAutosavedFrame){
                this.window.position = this.window.windowServer.screen.availableFrame.center;
            }
        }
    },

    close: function(){
        this.window.close();
    },

    unloadView: function(){
        UIWindowController.$super.unloadView.call(this);
        this._needsPrepare = true;
    }

});
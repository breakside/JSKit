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

// #import "UIApplication.js"
// #import "UIHTMLWindowServer.js"
// #import "UIState.js"
'use strict';

(function(){

var logger = JSLog("uikit", "application");

JSClass("UIHTMLApplication", UIApplication, {

    domWindow: null,

    initWithBundle: function(bundle, windowServer){
        UIHTMLApplication.$super.initWithBundle.call(this, bundle, windowServer);
        this.domWindow = this.windowServer.domWindow;
    },

    setup: function(completion, target){
        this.environment = JSEnvironment.initWithDictionary(this.bundle.info.HTMLApplicationEnvironment || {});
        this._baseURL = JSURL.initWithString(this.domWindow.location.origin + this.domWindow.location.pathname);
        var url = JSURL.initWithString(this.domWindow.location.href);
        var fragment = url.fragment;
        var query = "";
        var state = null;
        if (fragment !== null && fragment.length > 0){
            if (fragment[0] == '/'){
                var queryIndex = fragment.indexOf('?');
                if (queryIndex >= 0){
                    query = fragment.substr(queryIndex + 1);
                    state = fragment.substr(0, queryIndex);
                }else{
                    state = fragment;
                }
            }else{
                query = fragment;
            }
        }
        this.launchOptionsQueryString = query;
        this.setStateReplacingHTMLState(UIState.initWithPath(state));
        UIHTMLApplication.$super.setup.call(this, completion, target);
    },

    launchOptionsQueryString: null,

    launchOptions: function(){
        var options = this.bundle.info.UIApplicationLaunchOptions || {};
        var args = JSArguments.initWithOptions(options);
        args.parseQueryString(this.launchOptionsQueryString);
        return args;
    },

    openURL: function(url, options){
        if (options === undefined){
            options = {};
        }
        if (options.replacingApplication || url.scheme === "mailto" || url.scheme === "tel"){
            var application = this;
            var open = function(){
                application.domWindow.location.href = url.encodedString;
            };
            this.stop(open);
        }else{
            var child = this.domWindow.open(url.encodedString);
            if ((url.scheme == "http" || url.scheme == "https") && !child){
                if (this.delegate && this.delegate.applicationBrowserBlockedWindowForURL){
                    this.delegate.applicationBrowserBlockedWindowForURL(this, url);
                }
            }
        }
    },

    update: function(){
        var application = this;
        var reload = function(){
            application.domWindow.location.reload();
        };
        this.stop(reload);
    },

    baseURL: JSReadOnlyProperty('_baseURL'),

    setState: function(state){
        UIHTMLApplication.$super.setState.call(this, state);
        var url = JSURL.initWithURL(this.baseURL);
        if (state.path !== "/"){
            url.fragment = state.path;
        }
        if (!this._isHandlingHashChange){
            var href = url.encodedString;
            if (href != this.domWindow.location.href){
                this.domWindow.history.pushState(null, null, url.encodedString);
            }
        }
    },

    setStateReplacingHTMLState: function(state){
        UIHTMLApplication.$super.setState.call(this, state);
        var url = JSURL.initWithURL(this.baseURL);
        if (state.path !== "/"){
            url.fragment = state.path;
        }
        this.domWindow.history.replaceState(null, null, url.encodedString);
    },

    addEventListeners: function(){
        this.domWindow.addEventListener("error", this);
        this.domWindow.addEventListener("unhandledrejection", this);
        this.domWindow.addEventListener("beforeunload", this);
        this.domWindow.addEventListener("hashchange", this);
    },

    handleEvent: function(e){
        this['_event_' + e.type](e);
    },

    _event_beforeunload: function(e){
        if (this.delegate.applicationShouldWarnBeforeExit && this.delegate.applicationShouldWarnBeforeExit(this)){
            e.preventDefault();
            e.returnValue = "";
        }else{
            this.windowServer.stop(true);
        }
    },

    _event_error: function(e){
        var error = e.error;
        if (e.filename.startsWith(this._baseURL.encodedString)){
            logger.log("uncaught error");
            e.preventDefault();
            this._crash(error);
        }
    },

    _event_unhandledrejection: function(e){
        var error = e.reason;
        if (error instanceof Error){
            var frames = error.frames;
            if (frames.length === 0 || frames[0].filename.startsWith(this._baseURL.encodedString)){
                logger.log("unhandledrejection");
                e.preventDefault();
                this._crash(error);
            }
        }
    },

    _event_hashchange: function(e){
        this._isHandlingHashChange = true;
        try{
            var requestedURL = JSURL.initWithString(this.domWindow.location.href);
            var requestedFragment = requestedURL.fragment;
            var requestedPath = null;
            if (requestedFragment !== null && requestedFragment.length > 0){
                if (requestedFragment[0] == "/"){
                    var queryIndex = requestedFragment.indexOf('?');
                    if (queryIndex >= 0){
                        requestedPath = requestedFragment.substr(0, queryIndex);
                    }else{
                        requestedPath = requestedFragment;
                    }
                }
            }
            var requestedState = UIState.initWithPath(requestedPath);
            var state = null;
            if (this.delegate && this.delegate.applicationDidRequestState){
                state = this.delegate.applicationDidRequestState(this, requestedState);
            }
            if (state === null || state === undefined){
                state = this.state;
            }
            this.setStateReplacingHTMLState(state);
        }finally{
            this._isHandlingHashChange = false;
        }
    },

    _crash: function(error){
        if (this.delegate && this.delegate.applicationDidCrash){
            try{
                var logs = JSLog.getRecords();
                var promise = this.delegate.applicationDidCrash(this, error, logs);
                if (promise instanceof Promise){
                    promise.catch(function(e){
                        logger.error("UIApplication crash: %{error}", error);
                        logger.error("Error while handling crash: %{error}", e);
                    });
                }
            }catch (e){
                logger.error("UIApplication crash: %{error}", error);
                logger.error("Error while handling crash: %{error}", e);
            }
        }else{
            logger.error("UIApplication crash: %{error}", error);
        }
        this._showCrashScreen();
    },

    _showCrashScreen: function(){
        this.windowServer.stop();
        var root = this.windowServer.displayServer.rootElement;
        var cover = root.appendChild(root.ownerDocument.createElement('div'));
        cover.style.position = 'absolute';
        cover.style.backgroundColor = 'rgba(0,0,0,0.9)';
        cover.style.top = '0';
        cover.style.left = '0';
        cover.style.right = '0';
        cover.style.bottom = '0';
        var message;
        if (!message){
            message = "Sorry, there was a problem and the application needs to restart.\n\nPlease reload the page to continue.";
        }
        var label = cover.appendChild(cover.ownerDocument.createElement('div'));
        label.style.position = 'absolute';
        label.style.color = 'white';
        label.style.font = '400 normal 17px/24px sans-serif';
        label.appendChild(label.ownerDocument.createTextNode(message));
        label.style.top = 'calc(50% - 36px)';
        label.style.left = '20px';
        label.style.right = '20px';
        label.style.textAlign = 'center';
        label.style.whiteSpace = 'pre-wrap';
    }

});

JSGlobalObject.UIApplicationMain = function(rootElement, bootstrapper){
    var windowServer = UIHTMLWindowServer.initWithRootElement(rootElement);
    var application = UIHTMLApplication.initWithWindowServer(windowServer);
    application.run(function(error){
        if (error === null){
            application.addEventListeners();
        }
        if (bootstrapper){
            bootstrapper.applicationLaunchResult(application, error);
        }
    });
};

})();
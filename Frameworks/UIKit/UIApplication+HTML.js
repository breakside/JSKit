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
// jshint browser: true
'use strict';

(function(){

var originalSetup = UIApplication.prototype.setup;
var logger = JSLog("uikit", "application");

UIApplication.definePropertiesFromExtensions({

    setup: function(completion, target){
        this.environment = JSEnvironment.initWithDictionary(this.bundle.info.HTMLApplicationEnvironment || {});
        this._baseURL = JSURL.initWithString(window.location.origin + window.location.pathname);
        originalSetup.call(this, completion, target);
    },

    launchOptions: function(){
        var url = JSURL.initWithString(window.location.href);
        var fragment = url.fragment;
        var query = "";
        var positional = [];
        if (fragment !== null && fragment.length > 0){
            if (fragment[0] == '/'){
                var queryIndex = fragment.indexOf('?');
                if (queryIndex >= 0){
                    query = fragment.substr(queryIndex + 1);
                    positional.push(fragment.substr(0, queryIndex));
                }else{
                    positional.push(fragment);
                }
            }else{
                query = fragment;
            }
        }
        var options = this.bundle.info.UIApplicationLaunchOptions || {};
        var args = JSArguments.initWithOptions(options);
        args.parseQueryString(query, positional);
        url.fragment = positional.length > 0 ? positional[0] : null;
        window.history.replaceState(null, null, url.encodedString);
        return args;
    },

    openURL: function(url, options){
        if (options === undefined){
            options = {};
        }
        if (options.replacingApplication){
            var open = function(){
                window.location.href = url.encodedString;
            };
            this.stop(open);
        }else{
            var child = window.open(url.encodedString);
            if ((url.scheme == "http" || url.scheme == "https") && !child){
                if (this.delegate && this.delegate.applicationBrowserBlockedWindowForURL){
                    this.delegate.applicationBrowserBlockedWindowForURL(this, url);
                }
            }
        }
    },

    update: function(){
        var reload = function(){
            window.location.reload();
        };
        this.stop(reload);
    },

    baseURL: JSReadOnlyProperty('_baseURL'),

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

    _crash: function(error){
        logger.error(error);
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
        if (this.delegate && this.delegate.applicationDidCrash){
            var logs = JSLog.getRecords();
            message = this.delegate.applicationDidCrash(this, error, logs);
        }
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
    var application = UIApplication.initWithWindowServer(windowServer);
    application.run(function(error){
        if (error === null){
            window.addEventListener('error', application);
            window.addEventListener('unhandledrejection', application);
            window.addEventListener('beforeunload', application);
        }
        if (bootstrapper){
            bootstrapper.applicationLaunchResult(application, error);
        }
    });
};

})();
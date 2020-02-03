// #import "UIApplication.js"
// #import "UIHTMLWindowServer.js"
// jshint browser: true
'use strict';

(function(){

var originalSetup = UIApplication.prototype.setup;
var logger = JSLog("uikit", "application");

UIApplication.definePropertiesFromExtensions({

    setup: function(){
        this._baseURL = JSURL.initWithString(window.location.origin + window.location.pathname);
        originalSetup.call(this);
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
                window.location.href = url;
            };
            this.stop(open);
        }else{
            window.open(url.encodedString);
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

    _event_error: function(e){
        var error = e.error;
        if (e.filename.startsWith(this._baseURL.encodedString)){
            e.preventDefault();
            this._handleError(error);
        }
    },

    _event_unhandledrejection: function(e){
        var error = e.reason;
        if (error instanceof Error){
            // TODO: verify the error is from our app
            e.preventDefault();
            this._handleError(error);
        }
    },

    _handleError: function(error){
        logger.error(error);
        if (this.delegate && this.delegate.applicationDidCrash){
            var logs = JSLog.getRecords();
            this.delegate.applicationDidCrash(this, error, logs);
        }
    }

});

JSGlobalObject.UIApplicationMain = function(rootElement, bootstrapper){
    var windowServer = UIHTMLWindowServer.initWithRootElement(rootElement);
    var application = UIApplication.initWithWindowServer(windowServer);
    application.run(function(error){
        if (error === null){
            window.addEventListener('error', application);
            window.addEventListener('unhandledrejection', application);
        }
        if (bootstrapper){
            bootstrapper.applicationLaunchResult(application, error);
        }
    });
};

})();
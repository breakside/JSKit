/* global HTMLAppBootstrapper, main, console */
'use strict';

(function(){

window.HTMLAppBootstrapper = function(rootElement, jskitapp){
    if (this === undefined){
        return new HTMLAppBootstrapper(rootElement, jskitapp);
    }
    this.app = jskitapp;
    this.rootElement = rootElement;
    this.preflightID = jskitapp.preflightId;
    this.preflightSrc = jskitapp.preflightSrc;
    this.serviceWorkerSrc = jskitapp.serviceWorkerSrc;
    this.appSrc = jskitapp.appSrc;
    this.appCss = jskitapp.appCss;
    this.status = HTMLAppBootstrapper.STATUS.notstarted;
    this.statusDispatchTimeoutID = null;
    this.preflightChecks = [];
    this.minStatusInterval = 30;
    this.loadingScripts = {};
    this.preflightStorageKey = this.preflightID;
    this.preflightStorageValue = navigator.userAgent;
    this._isAppcacheInstalled = false;
    this.serviceWorker = null;
    this.application = null;
    this.error = null;
    this.logs = [];
    window.JSGlobalObject = window;
};

HTMLAppBootstrapper.STATUS = {
    notstarted: 'notstarted',
    checkingForUpdate: 'checkingForUpdate',
    installing: 'installing',
    updating: 'updating',
    updateError: 'updateError',
    preflightLoading: 'preflightLoading',
    preflightRunning: 'preflightRunning',
    preflightLoadError: 'preflightLoadError',
    preflightFailedChecks: 'preflightFailedChecks',
    appLoading: 'appLoading',
    appLoadError: 'appLoadError',
    appRunError: 'appRunError',
    appRunning: 'appRunning',
    appLaunched: 'appLaunched',
    appLaunchFailure: 'appLaunchFailure',
    appRequiresNoOtherInstances: 'appRequiresNoOtherInstances'
};

HTMLAppBootstrapper.prototype = {

    // expected to be overridden by whatver code instantiates the bootstrapper, in order
    // to receive callbacks for status changes so the bootstrap UI can be updated
    onstatus: function(){
    },

    onprogress: function(){
    },

    onlog: function(record){
    },

    run: function(){
        this.log_info("boot", "Booting " + this.app.bundleId + ", build " + this.app.buildId);
        if (this.serviceWorkerSrc && window.navigator.serviceWorker){
            this._installUsingServiceWorker(window.navigator.serviceWorker);
        }else if (document.documentElement.getAttribute("manifest") && window.applicationCache){
            this._installUsingAppcache(window.applicationCache);
        }else{
            this.log_warn("app", "Service worker and appcache not available");
            this.load();
        }
    },

    _hasLoaded: false,

    load: function(){
        if (this._hasLoaded){
            return;
        }
        this._hasLoaded = true;
        if (!this.hasPreflightPassedBefore()){
            this.loadPreflight();
        }else{
            this.loadApp();
        }
    },

    hasPreflightPassedBefore: function(){
        var ok = false;
        if (window.localStorage){
            ok = localStorage.getItem(this.preflightStorageKey) === this.preflightStorageValue;
        }else{
            this.log_info("preflight", "LocalStorage is not available");
        }
        return ok;
    },

    loadPreflight: function(){
        this.setStatus(HTMLAppBootstrapper.STATUS.preflightLoading);
        var bootstrapper = this;
        this.include(this.preflightSrc, true, function HTMLAppBootstrapper_preflightLoadSuccess(){
            bootstrapper.performPreflightChecks();
        }, function HTMLAppBootstrapper_preflightLoadError(e){
            bootstrapper.error = e;
            bootstrapper.log_error("preflight", "Script load failed: " + e.message);
            bootstrapper.setStatus(HTMLAppBootstrapper.STATUS.preflightLoadError);
        });
    },

    performPreflightChecks: function(){
        this.setStatus(HTMLAppBootstrapper.STATUS.preflightRunning);
        var failures = [];
        var check;
        for (var i = 0, l = this.preflightChecks.length; i < l; ++i){
            check = this.preflightChecks[i];
            try {
                if (!check.fn()){
                    failures.push({name: check.name});
                    this.log_warn("preflight", "failed check for '" + check.name + "'");
                }
            }catch (error){
                failures.push({name: check.name, error: error});
                this.log_warn("preflight", "failed check for '" + check.name + "'");
            }
        }
        if (failures.length > 0){
            this.preflightFailures = failures;
            this.setStatus(HTMLAppBootstrapper.STATUS.preflightFailedChecks);
        }else{
            if (window.localStorage){
                try{
                    localStorage.setItem(this.preflightStorageKey, this.preflightStorageValue);
                }catch (e){
                    this.log_warn("preflight", "failed to save result to localStorage: " + e.message);
                }
            }
            this.loadApp();
        }
    },

    loadApp: function(){
        this.setStatus(HTMLAppBootstrapper.STATUS.appLoading);
        this.linkStylesheets();
        window.addEventListener('error', this);
        window.addEventListener('unhandledrejection', this);
        this.includeAppSrc(this.appSrc.shift());
    },

    linkStylesheets: function(){
        var head = this.rootElement.ownerDocument.head;
        for (var i = 0, l = this.appCss.length; i < l; ++i){
            var link = head.ownerDocument.createElement('link');
            link.rel = "stylesheet";
            link.type = "text/css";
            link.href = this.appCss[i];
            head.appendChild(link);
        }
    },

    includeAppSrc: function(src){
        var bootstrapper = this;
        this.include(src, true, function HTMLAppBootstrapper_appScriptLoaded(){
            if (bootstrapper.appSrc.length){
                bootstrapper.includeAppSrc(bootstrapper.appSrc.shift());
            }else{
                bootstrapper.runApp();
            }
        }, function HTMLAppBootstrapper_appScriptLoadError(e){
            bootstrapper.log_error("app", "Include of '" + src + "' failed: " + e.message);
            bootstrapper.error = e;
            bootstrapper.setStatus(HTMLAppBootstrapper.STATUS.appLoadError);
        });
    },

    runApp: function(){
        if (window.JSLog){
            this._copyLogsToJSLog();
            this._recordLog = this._recordLogJSLog;
            this.getLogs = this._getLogsJSLog;
            if (!this.app.debug){
                window.JSLog.configure({print: false}, window.JSLog.Level.debug);
                window.JSLog.configure({print: false}, window.JSLog.Level.info);
                window.JSLog.configure({print: false}, window.JSLog.Level.log);
            }
        }
        try{
            this.setStatus(HTMLAppBootstrapper.STATUS.appRunning);
            main(this.rootElement, this);
        }catch (e){
            this.log_error("app", "Error calling main(): " + e.message);
            this.error = e;
            this.setStatus(HTMLAppBootstrapper.STATUS.appRunError);
        }
    },

    applicationLaunchResult: function(application, error){
        if (error !== null){
            if (error.message == "JSKIT_CLOSE_OTHER_INSTANCES"){
                this.setStatus(HTMLAppBootstrapper.STATUS.appRequiresNoOtherInstances);
            }else{
                this.error = error;
                this.setStatus(HTMLAppBootstrapper.STATUS.appLaunchFailure);
            }
            return;
        }
        window.removeEventListener('error', this);
        window.removeEventListener('unhandledrejection', this);
        this.application = application;
        this.setStatus(HTMLAppBootstrapper.STATUS.appLaunched);
    },

    include: function(src, async, callback, errorCallback){
        try{
            this.loadingScripts[src] = {
                compileError: null
            };
            var bootstrapper = this;
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.async = async;
            script.addEventListener('load', function HTMLAppBootstrapper_scriptLoad(e){
                if (bootstrapper.loadingScripts[src].compileError !== null){
                    errorCallback(bootstrapper.loadingScripts[src].compileError);
                    delete bootstrapper.loadingScripts[src];
                }else{
                    delete bootstrapper.loadingScripts[src];
                    callback();
                }
            });
            script.addEventListener('error', function HTMLAppBootstrapper_scriptLoadError(e){
                errorCallback(e);
            });
            script.src = src;
            this.rootElement.ownerDocument.body.appendChild(script);
        }catch (e){
            errorCallback(e);
        }
    },

    setStatus: function(status){
        this.log_info("status", this.status + " -> " + status);
        this.status = status;
        var bootstrapper = this;
        if (status === HTMLAppBootstrapper.STATUS.appRunning || status === HTMLAppBootstrapper.STATUS.appLaunched){
            if (this.statusDispatchTimeoutID !== null){
                clearTimeout(this.statusDispatchTimeoutID);
                this.statusDispatchTimeoutID = null;
            }
            bootstrapper.onstatus();
        }else if (this.statusDispatchTimeoutID === null){
            this.statusDispatchTimeoutID = setTimeout(function HTMLAppBootstrapper_dispatchStatusChanged(){
                bootstrapper.statusDispatchTimeoutID = null;
                bootstrapper.onstatus();
            }, this.minStatusInterval);
        }
    },

    handleEvent: function(e){
        this['event_' + e.type](e);
    },

    event_error: function(e){
        if (window.applicationCache && e.target === window.applicationCache){
            this.error = e.error;
            this.setStatus(HTMLAppBootstrapper.STATUS.updateError);
            return;
        }
        if (e.target === this.serviceWorker){
            if (!this._hasLoaded){
                this.error = e.error;
                this.setStatus(HTMLAppBootstrapper.STATUS.updateError);
                return;
            }
        }
        var baseURL = window.location.origin + window.location.pathname;
        var path = e.filename;
        if (path.substr(0, baseURL.length) === baseURL){
            path = path.substr(baseURL.length);
            var script = this.loadingScripts[path];
            if (script){
                e.preventDefault();
                this.log_error("app", "Syntax error in '" + path + "' on line " + e.lineno + ", column " + e.colno);
                script.compileError = e.error;
                return;
            }
        }
    },

    event_unhandledrejection: function(e){
        var error = e.reason;
        // TODO: 
    },

    // MARK: - Service Worker

    _installUsingServiceWorker: function(container){
        var bootstrapper = this;
        bootstrapper.log_debug("serviceWorker", "Getting registration");
        container.addEventListener('message', bootstrapper);
        container.getRegistration().then(function(registration){
            if (registration){
                bootstrapper.log_debug("serviceWorker", "Found registration");
                bootstrapper.log_debug("serviceWorker", "Checking for update");
                bootstrapper.setStatus(HTMLAppBootstrapper.STATUS.checkingForUpdate);
                return registration.update();
            }
            bootstrapper.log_debug("serviceWorker", "No registration found");
            bootstrapper.setStatus(HTMLAppBootstrapper.STATUS.installing);
            bootstrapper.log_debug("serviceWorker", "Registering");
            return container.register(bootstrapper.serviceWorkerSrc);
        }).then(function(registration){
            registration.addEventListener('updatefound', bootstrapper);
            if (registration.installing){
                if (bootstrapper.status === HTMLAppBootstrapper.STATUS.checkingForUpdate){
                    bootstrapper.log_debug("serviceWorker", "Installing Update");
                    bootstrapper.setStatus(HTMLAppBootstrapper.STATUS.updating);
                }else{
                    bootstrapper.log_debug("serviceWorker", "Installing for the first time");
                }
                bootstrapper.serviceWorker = registration.installing;
            }else if (registration.waiting){
                bootstrapper.log_debug("serviceWorker", "Waiting registration found.  Activating");
                bootstrapper.serviceWorker = registration.waiting;
                bootstrapper.serviceWorker.postMessage({type: "activate"});
            }else if (registration.active){
                bootstrapper.serviceWorker = registration.active;
                bootstrapper.log_debug("serviceWorker", "Active registration found");
                if (bootstrapper.serviceWorker.state == 'activating'){
                    bootstrapper.log_debug("serviceWorker", "Activating");
                }else{
                    bootstrapper.log_debug("serviceWorker", "Activated.");
                    bootstrapper.load();
                }
            }else{
                bootstrapper.log_error("serviceWorker", "Nothing to install???");
                throw new Error("No service worker found on registration");
            }
            bootstrapper.serviceWorker.addEventListener('statechange', bootstrapper);
        }).catch(function(error){
            bootstrapper.log_warn("serviceWorker", "Error with registration: " + error.message);
            if (container.controller){
                bootstrapper.log_debug("serviceWorker", "Proceeding with cached version");
                bootstrapper.load();
            }else{
                bootstrapper.error = error;
                bootstrapper.setStatus(HTMLAppBootstrapper.STATUS.updateError);
            }
        });
    },

    event_statechange: function(e){
        var worker = e.target;
        if (worker === this.serviceWorker){
            if (worker.state === "installed"){
                this.log_debug("serviceWorker", "Installed.  Activating");
                worker.postMessage({type: "activate"});
            }else if (worker.state === "activated"){
                this.log_debug("serviceWorker", "Activated");
                this.load();
            }
        }else{
            if (worker.state == "installed"){
                this.log_debug("serviceWorker", "Update Installed");
                if (this.application !== null){
                    if (this.application.delegate && this.application.delegate.applicationUpdateAvailable){
                        this.log_debug("serviceWorker", "Notifying application delegate");
                        this.application.delegate.applicationUpdateAvailable(this.application);
                    }
                }
            }
        }
    },

    event_message: function(e){
        var container = e.target;
        var worker = e.source;
        var d = Math.round(e.data.total / 10);
        if (worker === this.serviceWorker){
            if (e.data.type == 'progress'){
                if (e.data.loaded % d === 0){
                    this.log_debug("serviceWorker", "Progress " + e.data.loaded + '/' + e.data.total);
                }
                this.onprogress(e.data.loaded, e.data.total);
            }else if (e.data.type == 'error'){
                this.log_warn("serviceWorker", "Install error: " + e.data.message);
                if (container.controller){
                    this.log_debug("serviceWorker", "Proceeding with cached version");
                    this.load();
                }else{
                    this.error = new Error(e.data.message);
                    this.setStatus(HTMLAppBootstrapper.STATUS.updateError);
                }
            }
        }else{
            if (e.data.type == 'progress'){
                if (e.data.loaded % d === 0){
                    this.log_debug("serviceWorker", "Progress from new worker " + e.data.loaded + '/' + e.data.total);
                }
                this.onprogress(e.data.loaded, e.data.total);
            }
        }
    },

    event_updatefound: function(e){
        var registration = e.target;
        var worker = registration.installing;
        if (worker === this.serviceWorker){
            return;
        }
        this.log_debug("serviceWorker", "Update found");
        if (worker){
            worker.addEventListener('statechange', this);
        }
        if (!this._hasLoaded){
            this.log_debug("serviceWorker", "Adopting new worker");
            this.serviceWorker = worker;
            if (!this.serviceWorker){
                this.log_warn("serviceWorker", "null installer");
                this.error = new Error("null installing worker");
                this.setStatus(HTMLAppBootstrapper.STATUS.updateError);
            }
        }
    },

    // MARK: - Appcache

    _installUsingAppcache: function(appcache){
        this._isAppcacheInstalled = window.applicationCache.status !== window.applicationCache.UNCACHED;
        appcache.addEventListener('checking', this);
        appcache.addEventListener('downloading', this);
        appcache.addEventListener('noupdate', this);
        appcache.addEventListener('progress', this);
        appcache.addEventListener('error', this);
        appcache.addEventListener('updateready', this);
        appcache.addEventListener('cached', this);
        appcache.addEventListener('obsoleted', this);
    },

    event_checking: function(e){
        this.log_info("appcache", 'checking app cache');
        this.setStatus(HTMLAppBootstrapper.STATUS.checkingForUpdate);
    },

    event_downloading: function(e){
        this.log_info("appcache", 'cache downloading');
        this.setStatus(this._isAppcacheInstalled ? HTMLAppBootstrapper.STATUS.updating : HTMLAppBootstrapper.STATUS.installing);
    },

    event_noupdate: function(e){
        this.log_info("appcache", 'no update');
        this.load();
    },

    event_progress: function(e){
        if (e.lengthComputable){
            this.onprogress(e.loaded, e.total);
        }else{
            // this.log_info("appcache", 'progress is not length computable');
        }
    },

    event_cached: function(e){
        this.log_info("appcache", 'first version cached');
        this.load();
    },

    event_updateready: function(e){
        this.log_info("appcache", 'new version available');
        if (this._hasLoaded){
            // TODO: communicate to app
        }else{
            e.target.swapCache();
            this.load();
        }
    },

    event_obsoleted: function(e){
        this.log_info("appcache", 'cache obsoleted');
        this.load();
    },

    // MARK: - Logging

    log_debug: function(category, message){
        this._writeLog("debug", category, message);
    },

    log_info: function(category, message){
        this._writeLog("info", category, message);
    },

    log_log: function(category, message){
        this._writeLog("log", category, message);
    },

    log_warn: function(category, message){
        this._writeLog("warn", category, message);
    },

    log_error: function(category, message){
        this._writeLog("error", category, message);
    },

    _writeLog: function(level, category, message){
        var record = {
            level: level,
            subsystem: "boot",
            category: category,
            timestamp: Date.now() / 1000,
            message: message,
            args: []
        };
        this._recordLog(record);
    },

    _recordLog: function(record){
        this.logs.push(record);
        this.onlog(record);
    },

    getLogs: function(){
        return this.logs;
    },

    _copyLogsToJSLog: function(){
        for (var i = 0, l = this.logs.length; i < l; ++i){
            window.JSLog.write(this.logs[i]);
        }
    },

    _recordLogJSLog: function(record){
        window.JSLog.write(record);
        this.onlog(record);
    },

    _getLogsJSLog: function(){
        return window.JSLog.getRecords();
    }

};

HTMLAppBootstrapper.formatter = {
    paddedString: function(str, width, padding, right){
        if (str.length > width){
            str = str.substr(0, width - 3) + '...';
        }
        var i = width - str.length;
        if (right){
            while (i > 0){
                str += padding;
                --i;
            }
        }else{
            while (i > 0){
                str = padding + str;
                --i;
            }
        }
        return str;
    },
    log: function(log){
        return [
            HTMLAppBootstrapper.formatter.timestamp(log.timestamp),
            HTMLAppBootstrapper.formatter.paddedString(log.level, 5, ' ', true),
            HTMLAppBootstrapper.formatter.paddedString(log.subsystem, 16, ' ', true),
            HTMLAppBootstrapper.formatter.paddedString(log.category, 16, ' ', true),
            log.message
        ].join(" ");
    },
    timestamp: function(t){
        var n = Math.round(t * 1000);
        var f = n % 1000;
        var d = (n - f) / 1000;
        var fs = f.toString();
        var ds = d.toString();
        return HTMLAppBootstrapper.formatter.paddedString(ds, 10, '0') + '.' + HTMLAppBootstrapper.formatter.paddedString(fs, 3, '0');
    }
};

})();
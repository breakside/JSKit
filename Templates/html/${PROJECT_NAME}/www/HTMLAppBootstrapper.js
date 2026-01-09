/* global HTMLAppBootstrapper, main, console */
'use strict';

(function(){

window.HTMLAppBootstrapper = function(rootElement, jskitapp){
    if (this === undefined){
        return new HTMLAppBootstrapper(rootElement, jskitapp);
    }
    this.rootElement = rootElement;
    if (jskitapp.TEMPLATE === "JSKIT_APP"){
        window.bootstrapper = this;
        this.app = null;
    }else{
        this.app = jskitapp;
        this.preflightID = jskitapp.preflightId;
        this.preflightSrc = jskitapp.preflightSrc;
        this.serviceWorkerSrc = jskitapp.serviceWorkerSrc;
        this.appSrc = jskitapp.appSrc;
        this.appCss = jskitapp.appCss;
    }
    this.id = this._generateRandomID();
    this.status = HTMLAppBootstrapper.STATUS.notstarted;
    this.preflightChecks = [];
    this.loadingScripts = {};
    this.preflightStorageKey = this.preflightID;
    this.preflightStorageValue = navigator.userAgent;
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
    appRequiresNoOtherInstances: 'appRequiresNoOtherInstances',
    appCrashed: 'appCrashed'
};

HTMLAppBootstrapper.prototype = {

    // expected to be overridden by whatver code instantiates the bootstrapper, in order
    // to receive callbacks for status changes so the bootstrap UI can be updated
    onstatus: function(status){
    },

    onprogress: function(loaded, total){
    },

    onlongload: function(i){
    },

    onerror: function(error){
    },

    onlog: function(record){
    },

    ontimeout: function(){
    },

    onhidden: function(){
    },

    run: function(){
        if (this.app === null){
            return;
        }
        this.rootElement.ownerDocument.addEventListener("visibilitychange", this);
        this._resetTimeout();
        this.log_debug("boot", "Booting " + this.app.bundleId + ", version " + this.app.bundleVersion + " (build " + this.app.buildId + ")");
        if (this.serviceWorkerSrc && window.navigator.serviceWorker){
            this._installUsingServiceWorker(window.navigator.serviceWorker);
        }else{
            this.log_warn("app", "Service worker not available");
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
            bootstrapper.setStatus(HTMLAppBootstrapper.STATUS.preflightLoadError);
            bootstrapper.reportError(e);
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
        this.log_debug("boot", "including " + this.appSrc.length + " scripts");
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
        if (!this.app.debug){
            this.log_debug("boot", "including " + src);
        }
        this.include(src, true, function HTMLAppBootstrapper_appScriptLoaded(){
            if (bootstrapper.appSrc.length){
                bootstrapper.includeAppSrc(bootstrapper.appSrc.shift());
            }else{
                bootstrapper.runApp();
            }
        }, function HTMLAppBootstrapper_appScriptLoadError(e){
            bootstrapper.error = e;
            bootstrapper.setStatus(HTMLAppBootstrapper.STATUS.appLoadError);
            bootstrapper.reportError(e);
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
            this.reportError(e);
        }
    },

    applicationLaunchResult: function(application, error){
        if (error !== null){
            if (error.message == "JSKIT_CLOSE_OTHER_INSTANCES"){
                this.setStatus(HTMLAppBootstrapper.STATUS.appRequiresNoOtherInstances);
            }else{
                this.error = error;
                this.setStatus(HTMLAppBootstrapper.STATUS.appLaunchFailure);
                this.reportError(error);
            }
            return;
        }
        window.removeEventListener('error', this);
        window.removeEventListener('unhandledrejection', this);
        this.application = application;
        this.setStatus(HTMLAppBootstrapper.STATUS.appLaunched);
    },

    applicationDidCrash: function(application){
        this.setStatus(HTMLAppBootstrapper.STATUS.appCrashed);
    },

    scriptContainerElement: null,

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
                if (!bootstrapper.loadingScripts[src]){
                    return;
                }
                if (bootstrapper.loadingScripts[src].compileError !== null){
                    errorCallback(bootstrapper.loadingScripts[src].compileError);
                    delete bootstrapper.loadingScripts[src];
                }else{
                    delete bootstrapper.loadingScripts[src];
                    callback();
                }
            });
            script.addEventListener('error', function HTMLAppBootstrapper_scriptLoadError(e){
                errorCallback(new Error("Include of '" + src + "' failed"));
            });
            script.src = src;
            if (this.scriptContainerElement === null){
                this.scriptContainerElement = this.rootElement.appendChild(this.rootElement.ownerDocument.createElement("div"));
                this.scriptContainerElement.style.display = "none";
            }
            this.scriptContainerElement.appendChild(script);
        }catch (e){
            errorCallback(e);
        }
    },

    setStatus: function(status){
        if (status !== HTMLAppBootstrapper.STATUS.appCrashed){
            this.log_debug("boot", this.status + " -> " + status);
        }
        this.status = status;
        switch (this.status){
            case HTMLAppBootstrapper.STATUS.preflightLoading:
            case HTMLAppBootstrapper.STATUS.preflightRunning:
            case HTMLAppBootstrapper.STATUS.appLoading:
            case HTMLAppBootstrapper.STATUS.appRunning:
            case HTMLAppBootstrapper.STATUS.updating:
                this._resetTimeout();
                break;
            case HTMLAppBootstrapper.STATUS.checkingForUpdate:
            case HTMLAppBootstrapper.STATUS.installing:
                this._resetTimeout();
                this._startLongLoadInterval();
                break;
            case HTMLAppBootstrapper.STATUS.preflightFailedChecks:
            case HTMLAppBootstrapper.STATUS.preflightLoadError:
            case HTMLAppBootstrapper.STATUS.updateError:
            case HTMLAppBootstrapper.STATUS.appLoadError:
            case HTMLAppBootstrapper.STATUS.appRunError:
            case HTMLAppBootstrapper.STATUS.appLaunchFailure:
            case HTMLAppBootstrapper.STATUS.appRequiresNoOtherInstances:
            case HTMLAppBootstrapper.STATUS.appLaunched:
                this.rootElement.ownerDocument.removeEventListener("visibilitychange", this);
                this._cancelTimeout();
                this._cancelLongLoadInterval();
                break;
            case HTMLAppBootstrapper.STATUS.appCrashed:
                break;
        }
        this.onstatus(this.status);
    },

    _hasSeenProgress: false,

    setProgress: function(loaded, total){
        if (!this._hasSeenProgress){
            this._hasSeenProgress = true;
            this._cancelTimeout();
        }
        if (loaded === total){
            this._resetTimeout();
        }
        this.onprogress(loaded, total);
    },

    handleEvent: function(e){
        this['event_' + e.type](e);
    },

    event_error: function(e){
        if (window.applicationCache && e.target === window.applicationCache){
            this.error = e.error;
            this.setStatus(HTMLAppBootstrapper.STATUS.updateError);
            this.reportError(e.error);
            return;
        }
        if (e.target === this.serviceWorker){
            if (!this._hasLoaded){
                this.error = e.error;
                this.setStatus(HTMLAppBootstrapper.STATUS.updateError);
                this.reportError(e.error);
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

    event_visibilitychange: function(e){
        if (this.rootElement.ownerDocument.visibilityState === "hidden"){
            this.onhidden();
        }
    },

    // MARK: - Timeouts

    timeoutInterval: 30,
    _timeoutID: null,

    _resetTimeout: function(){
        if (this._timeoutID !== null){
            clearTimeout(this._timeoutID);
        }
        var bootstrapper = this;
        this._timeoutID = setTimeout(function(){
            bootstrapper._handleTimeout();
        }, this.timeoutInterval * 1000);
    },

    _cancelTimeout: function(){
        if (this._timeoutID !== null){
            clearTimeout(this._timeoutID);
            this._timeoutID = null;
        }
    },

    _handleTimeout: function(){
        this._timeoutID = null;
        this.ontimeout();
        window.location.reload();
    },

    _longLoadIntervalID: null,
    _longLoadCount: 0,
    longLoadInterval: 5,

    _startLongLoadInterval: function(){
        if (this._longLoadIntervalID === null){
            var bootstrapper = this;
            this._longLoadIntervalID = setInterval(function(){
                bootstrapper._handleLongLoadInterval();
            }, this.longLoadInterval * 1000);
        }
    },

    _cancelLongLoadInterval: function(){
        if (this._longLoadIntervalID !== null){
            clearInterval(this._longLoadIntervalID);
            this._longLoadIntervalID = null;
        }
    },

    _handleLongLoadInterval: function(){
        this.onlongload(this._longLoadCount);
        ++this._longLoadCount;
    },

    _currentTimestamp: function(){
        return Date.now() / 1000;
    },

    _generateRandomID: function(){
        var data = new Uint8Array(20);
        var i, l;
        if (window.crypto){
            window.crypto.getRandomValues(data);
        }else{
            for (i = 0, l = data.length; i < l; ++i){
                data[i] = Math.floor(Math.random() * 256);
            }
        }
        var id = "";
        var h;
        for (i = 0, l = data.length; i < l; ++i){
            h = data[i].toString(16);
            if (h.length == 1){
                id += "0";
            }
            id += h;
        }
        return id;
    },

    // MARK: - Service Worker

    serviceWorkerRegistration: null,

    _installUsingServiceWorker: function(container){
        var bootstrapper = this;
        bootstrapper.log_debug("serviceWorker", "Getting registration");
        container.addEventListener('message', bootstrapper);
        container.getRegistration().then(function(registration){
            if (registration){
                bootstrapper.serviceWorkerRegistration = registration;
                bootstrapper.log_debug("serviceWorker", "Found registration");
                bootstrapper.log_debug("serviceWorker", "Checking for update");
                bootstrapper.setStatus(HTMLAppBootstrapper.STATUS.checkingForUpdate);
                registration.addEventListener('updatefound', bootstrapper);
                bootstrapper.log_debug("serviceWorker", "calling update()");
                return registration.update();
            }
            bootstrapper.log_debug("serviceWorker", "No registration found");
            bootstrapper.setStatus(HTMLAppBootstrapper.STATUS.installing);
            bootstrapper.log_debug("serviceWorker", "Registering");
            return container.register(bootstrapper.serviceWorkerSrc);
        }).then(function(registration){
            bootstrapper.registration = registration;
            bootstrapper.log_debug("serviceWorker", "update() or register() resolved");
            bootstrapper.log_debug("serviceWorker", "registration.installing = " + (registration.installing ? "ServiceWorker" : "null"));
            bootstrapper.log_debug("serviceWorker", "registration.waiting = " + (registration.waiting ? "ServiceWorker" : "null"));
            bootstrapper.log_debug("serviceWorker", "registration.active = " + (registration.active ? "ServiceWorker" : "null"));
            if (registration.installing){
                bootstrapper.serviceWorker = registration.installing;
                bootstrapper.serviceWorker.addEventListener('statechange', bootstrapper);
                bootstrapper.log_debug("serviceWorker", "Installing registration found (state = " + bootstrapper.serviceWorker.state + ")");
                if (bootstrapper.status === HTMLAppBootstrapper.STATUS.checkingForUpdate){
                    bootstrapper.log_debug("serviceWorker", "Installing Update");
                    bootstrapper.setStatus(HTMLAppBootstrapper.STATUS.updating);
                }else{
                    bootstrapper.log_debug("serviceWorker", "Installing for the first time");
                }
            }else if (registration.waiting){
                bootstrapper.serviceWorker = registration.waiting;
                bootstrapper.serviceWorker.addEventListener('statechange', bootstrapper);
                bootstrapper.log_debug("serviceWorker", "Waiting registration found (state = " + bootstrapper.serviceWorker.state + ").  Activating");
                bootstrapper.serviceWorker.postMessage({type: "activate"});
            }else if (registration.active){
                bootstrapper.serviceWorker = registration.active;
                bootstrapper.serviceWorker.addEventListener('statechange', bootstrapper);
                bootstrapper.log_debug("serviceWorker", "Active registration found (state = " + bootstrapper.serviceWorker.state + ")");
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
        }).catch(function(error){
            bootstrapper.log_warn("serviceWorker", "Error with registration: " + error.message);
            if (container.controller){
                bootstrapper.serviceWorker = container.controller;
                bootstrapper.log_debug("serviceWorker", "Proceeding with cached version");
                bootstrapper.load();
                bootstrapper.error = error;
                bootstrapper.reportError(error);
            }else{
                bootstrapper.error = error;
                bootstrapper.setStatus(HTMLAppBootstrapper.STATUS.updateError);
                bootstrapper.reportError(error);
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
            }else{
                this.log_debug("serviceWorker", "statechange " + worker.state);
            }
        }else{
            this.log_debug("serviceWorker", "other statechange " + worker.state);
            if (worker.state == "installed"){
                this.log_debug("serviceWorker", "Update Installed");
                if (this.application !== null){
                    this.log_debug("serviceWorker", "Notifying application");
                    this.application.notifyUpdateAvailable();
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
                if ((e.data.loaded % d === 0) || (e.data.loaded === e.data.total)){
                    this.log_debug("serviceWorker", "Progress " + e.data.loaded + '/' + e.data.total);
                }
                this.setProgress(e.data.loaded, e.data.total);
            }else if (e.data.type == 'error'){
                this.log_warn("serviceWorker", "Install error: " + e.data.message);
                if (container.controller){
                    this.serviceWorker = worker;
                    this.log_debug("serviceWorker", "Proceeding with cached version");
                    this.load();
                }else{
                    var error = new Error(e.data.message);
                    this.error = error;
                    this.setStatus(HTMLAppBootstrapper.STATUS.updateError);
                    this.reportError(error);
                }
            }
        }else{
            if (e.data.type == 'progress'){
                if ((e.data.loaded % d === 0) || (e.data.loaded === e.data.total)){
                    this.log_debug("serviceWorker", "Progress from new worker " + e.data.loaded + '/' + e.data.total);
                }
            }
        }
    },

    event_updatefound: function(e){
        var registration = e.target;
        var worker = registration.installing;
        // In most browsers, the registration.update() promise resolves immediately
        // and we set this.serviceWorker before any "updatefound" event fires.
        // But in Firefox, the update() promise doesn't resolve until after
        // the install is complete, so this is where we have to detect an update starting.
        if (this.serviceWorker === null){
            this.log_debug("serviceWorker", "Update found before service worker set");
            this.setStatus(HTMLAppBootstrapper.STATUS.updating);
            this.serviceWorker = worker;
        }
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
                var error = new Error("null installing worker");
                this.error = error;
                this.setStatus(HTMLAppBootstrapper.STATUS.updateError);
                this.reportError(error);
            }
        }
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
            timestamp: this._currentTimestamp(),
            message: message,
            args: []
        };
        this._recordLog(record);
    },

    _recordLog: function(record){
        this.logs.push(record);
        if (this.app.debug){
            console[record.level](HTMLAppBootstrapper.formatter.log(record));
        }
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
    },

    // MARK: - Telemetry

    reportError: function(error, fingerprint){
        if (this.app.debug){
            console.error(error);
        }
        this.onerror(error);
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
            HTMLAppBootstrapper.formatter.paddedString(log.category, 20, ' ', true),
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
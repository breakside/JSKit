// jshint browser: true
/* global HTMLAppBootstrapper, console */
'use strict';

(function(){

var logger = {
    log: function(){},
    debug: function(){},
    info: function(){},
    warn: function(){
        console.warn.apply(console, arguments);
    },
    error: function(){
        console.error.apply(console, arguments);
    }
};

window.HTMLAppBootstrapper = function(rootElement, jskitapp){
    if (this === undefined){
        return new HTMLAppBootstrapper(rootElement, jskitapp);
    }
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
    this.scriptConfigs = {};
    this.preflightStorageKey = this.preflightID;
    this.preflightStorageValue = navigator.userAgent;
    this.caughtErrors = [];
    this._isAppcacheInstalled = false;
    this.serviceWorker = null;
    this.application = null;
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
    appLaunchFailure: 'appLaunchFailure'
};

HTMLAppBootstrapper.prototype = {

    // expected to be overridden by whatver code instantiates the bootstrapper, in order
    // to receive callbacks for status changes so the bootstrap UI can be updated
    onstatus: function(){
    },

    onprogress: function(){
    },

    run: function(){
        if (this.serviceWorkerSrc && window.navigator.serviceWorker){
            this._installUsingServiceWorker(window.navigator.serviceWorker);
        }else if (document.documentElement.getAttribute("manifest") && window.applicationCache){
            this._installUsingAppcache(window.applicationCache);
        }else{
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
        }
        return ok;
    },

    loadPreflight: function(){
        this.setStatus(HTMLAppBootstrapper.STATUS.preflightLoading);
        var bootstrapper = this;
        this.include(this.preflightSrc, true, function HTMLAppBootstrapper_preflightLoadSuccess(){
            bootstrapper.performPreflightChecks();
        }, function HTMLAppBootstrapper_preflightLoadError(e){
            bootstrapper.setStatus(HTMLAppBootstrapper.STATUS.preflightLoadError);
        });
    },

    setLogger: function(logger_){
        logger = logger_;
    },

    performPreflightChecks: function(){
        this.setStatus(HTMLAppBootstrapper.STATUS.preflightRunning);
        var failures = [];
        for (var i = 0, l = this.preflightChecks.length; i < l; ++i){
            try {
                if (!this.preflightChecks[i].fn()){
                    failures.push({check: this.preflightChecks[i].name});
                }
            }catch (error){
                this.caughtErrors.push(error);
                failures.push({check: this.preflightChecks[i].name, error: error});
                logger.error(error);
            }
        }
        if (failures.length > 0){
            this.preflightFailures = failures;
            this.setStatus(HTMLAppBootstrapper.STATUS.preflightFailedChecks);
        }else{
            if (window.localStorage){
                localStorage.setItem(this.preflightStorageKey, this.preflightStorageValue);
            }
            this.loadApp();
        }
    },

    loadApp: function(){
        this.setStatus(HTMLAppBootstrapper.STATUS.appLoading);
        this.linkStylesheets();
        window.addEventListener('error', this);
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
                window.removeEventListener('error', this);
                try {
                    bootstrapper.runApp();
                }catch (e){
                    bootstrapper.caughtErrors.push(e);
                    bootstrapper.setStatus(HTMLAppBootstrapper.STATUS.appRunError);
                    logger.error(e);
                }
            }
        }, function HTMLAppBootstrapper_appScriptLoadError(){
            bootstrapper.setStatus(HTMLAppBootstrapper.STATUS.appLoadError);
        });
    },

    runApp: function(){
        var bootstrapper = this;
        main(this.rootElement, this);
        this.setStatus(HTMLAppBootstrapper.STATUS.appRunning);
    },

    applicationLaunchResult: function(application, success){
        if (success){
            this.application = application;
            this.setStatus(HTMLAppBootstrapper.STATUS.appLaunched);
        }else{
            this.setStatus(HTMLAppBootstrapper.STATUS.appLaunchFailure);
        }
    },

    include: function(src, async, callback, errorCallback){
        try{
            this.scriptConfigs[src] = {
                compileError: false
            };
            var bootstrapper = this;
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.async = async;
            script.addEventListener('load', function HTMLAppBootstrapper_scriptLoad(e){
                if (bootstrapper.scriptConfigs[src].compileError){
                    errorCallback(bootstrapper.scriptConfigs[src].compileError);
                    delete bootstrapper.scriptConfigs[src];
                }else{
                    delete bootstrapper.scriptConfigs[src];
                    callback();
                }
            });
            script.addEventListener('error', function HTMLAppBootstrapper_scriptLoadError(e){
                logger.error(e);
                errorCallback(e);
            });
            script.src = src;
            this.rootElement.ownerDocument.body.appendChild(script);
        }catch (e){
            this.caughtErrors.push(e);
            logger.error(e);
            errorCallback(e);
        }
    },

    setStatus: function(status){
        // console.log(this.status + ' -> ' + status);
        this.status = status;
        var bootstrapper = this;
        if (this.statusDispatchTimeoutID === null){
            this.statusDispatchTimeoutID = setTimeout(function HTMLAppBootstrapper_dispatchStatusChanged(){
                bootstrapper.statusDispatchTimeoutID = null;
                bootstrapper.onstatus();
            }, this.minStatusInterval);
        }
    },

    handleEvent: function(e){
        this[e.type](e);
    },


    error: function(e){
        if (window.applicationCache && e.target === window.applicationCache){
            logger.error(e);
            this.setStatus(HTMLAppBootstrapper.STATUS.updateError);
            return;
        }
        if (e.target === this.serviceWorker){
            if (!this._hasLoaded){
                logger.error(e);
                this.setStatus(HTMLAppBootstrapper.STATUS.updateError);
                return;
            }
        }
        var src;
        for (src in this.scriptConfigs){
            if (src.length <= e.filename.length){
                if (e.filename.substr(e.filename.length - src.length) == src){
                    e.preventDefault();
                    this.caughtErrors.push(e);
                    this.scriptConfigs[src].compileError = e;
                    logger.error(e);
                    return;
                }
            }
        }
        logger.debug("Error from unknown source");
        logger.error(e);
    },

    // MARK: - Service Worker

    _installUsingServiceWorker: function(container){
        var bootstrapper = this;
        logger.debug("[Service Worker] Getting registration");
        container.addEventListener('message', bootstrapper);
        container.getRegistration().then(function(registration){
            if (registration){
                logger.debug("[Service Worker] Found registration");
                logger.debug("[Service Worker] Checking for update");
                bootstrapper.setStatus(HTMLAppBootstrapper.STATUS.checkingForUpdate);
                registration.addEventListener('updatefound', bootstrapper);
                return registration.update().then(function(registration){
                    if (registration.installing){
                        logger.debug("[Service Worker] Installing Update");
                        bootstrapper.setStatus(HTMLAppBootstrapper.STATUS.updating);
                        bootstrapper.serviceWorker = registration.installing;
                    }else if (registration.waiting){
                        logger.debug("[Service Worker] Waiting registration found.  Activating");
                        bootstrapper.serviceWorker = registration.waiting;
                        bootstrapper.serviceWorker.addEventListener('statechange', bootstrapper);
                        bootstrapper.serviceWorker.postMessage({type: "activate"});
                    }else if (registration.active){
                        bootstrapper.serviceWorker = registration.active;
                        logger.debug("[Service Worker] Active registration found");
                        if (bootstrapper.serviceWorker.state == 'activating'){
                            logger.debug("[Service Worker] Activating");
                            bootstrapper.serviceWorker.addEventListener('statechange', bootstrapper);
                        }else{
                            logger.debug("[Service Worker] Activated.");
                            bootstrapper.load();
                        }
                    }else{
                        logger.error("[Service Worker] Nothing to install???");
                        throw new Error("No service worker found on registration");
                    }
                    bootstrapper.serviceWorker.addEventListener('statechange', bootstrapper);
                    bootstrapper.serviceWorker.addEventListener('error', bootstrapper);
                });
            }
            logger.debug("[Service Worker] No registration found");
            bootstrapper.setStatus(HTMLAppBootstrapper.STATUS.installing);
            logger.debug("[Service Worker] Registering");
            return container.register(bootstrapper.serviceWorkerSrc).then(function(registration){
                registration.addEventListener('updatefound', bootstrapper);
                if (registration.installing){
                    logger.debug("[Service Worker] Installing for the first time");
                    bootstrapper.serviceWorker = registration.installing;
                }else if (registration.waiting){
                    logger.warn("[Service Worker] Waiting registration found.  Activating");
                    bootstrapper.serviceWorker = registration.waiting;
                    bootstrapper.serviceWorker.postMessage({type: "activate"});
                }else if (registration.active){
                    logger.warn("[Service Worker] Active registration found???");
                    bootstrapper.serviceWorker = registration.active;
                    if (bootstrapper.serviceWorker.state == 'activating'){
                        logger.warn("[Service Worker] Already activating");
                    }else{
                        logger.warn("[Service Worker] Already activated???");
                        bootstrapper.load();
                    }
                }else{
                    logger.error("[Service Worker] Nothing to install???");
                    throw new Error("No service worker found on registration");
                }
                bootstrapper.serviceWorker.addEventListener('statechange', bootstrapper);
                bootstrapper.serviceWorker.addEventListener('error', bootstrapper);
            });
        }).catch(function(error){
            logger.warn("[Service Worker] Error with registration");
            if (container.controller){
                logger.warn(error);
                logger.debug("[Service Worker] Proceeding with cached version");
                bootstrapper.load();
            }else{
                logger.error(error);
                bootstrapper.setStatus(HTMLAppBootstrapper.STATUS.updateError);
            }
        });
    },

    statechange: function(e){
        var worker = e.target;
        if (worker === this.serviceWorker){
            if (worker.state === "installed"){
                logger.debug("[Service Worker] Installed.  Activating");
                worker.postMessage({type: "activate"});
            }else if (worker.state === "activated"){
                logger.debug("[Service Worker] Activated");
                this.load();
            }
        }else{
            if (worker.state == "installed"){
                logger.debug("[Service Worker] Update Installed");
                if (this.application !== null){
                    if (this.application.delegate && this.application.delegate.applicationUpdateAvailable){
                        logger.debug("[Service Worker] Notifying application delegate");
                        this.application.delegate.applicationUpdateAvailable(this.application);
                    }
                }
            }
        }
    },

    message: function(e){
        var container = e.target;
        var worker = e.source;
        var d = Math.round(e.data.total / 10);
        if (worker === this.serviceWorker){
            if (e.data.type == 'progress'){
                if (e.data.loaded % d === 0){
                    logger.debug("[Service Worker] Progress " + e.data.loaded + '/' + e.data.total);
                }
                this.onprogress(e.data.loaded, e.data.total);
            }else if (e.data.type == 'error'){
                logger.warn("[Service Worker] Install error");
                if (container.controller){
                    logger.debug("[Service Worker] Proceeding with cached version");
                    this.load();
                }else{
                    logger.error(e.data.message);
                    this.setStatus(HTMLAppBootstrapper.STATUS.updateError);
                }
            }
        }else{
            if (e.data.type == 'progress'){
                if (e.data.loaded % d === 0){
                    logger.debug("[Service Worker] Progress from new worker " + e.data.loaded + '/' + e.data.total);
                }
                this.onprogress(e.data.loaded, e.data.total);
            }
        }
    },

    updatefound: function(e){
        var registration = e.target;
        var worker = registration.installing;
        if (worker === this.serviceWorker){
            return;
        }
        logger.debug("[Service Worker] Update found");
        if (worker){
            worker.addEventListener('statechange', this);
            worker.addEventListener('error', this);
        }
        if (!this._hasLoaded){
            logger.debug("[Service Worker] Adopting new worker");
            this.serviceWorker = worker;
            if (!this.serviceWorker){
                logger.warn("[Service Worker] null installer");
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

    checking: function(e){
        logger.info('checking app cache');
        this.setStatus(HTMLAppBootstrapper.STATUS.checkingForUpdate);
    },

    downloading: function(e){
        logger.info('cache downloading');
        this.setStatus(this._isAppcacheInstalled ? HTMLAppBootstrapper.STATUS.updating : HTMLAppBootstrapper.STATUS.installing);
    },

    noupdate: function(e){
        logger.info('no update');
        this.load();
    },

    progress: function(e){
        if (e.lengthComputable){
            this.onprogress(e.loaded, e.total);
        }else{
            // logger.info('progress is not length computable');
        }
    },

    cached: function(e){
        logger.info('first version cached');
        this.load();
    },

    updateready: function(e){
        logger.info('new version available');
        if (this._hasLoaded){
            // TODO: communicate to app
        }else{
            e.target.swapCache();
            this.load();
        }
    },

    obsoleted: function(e){
        logger.info('cache obsoleted');
        this.load();
    }

};

})();
/* global HTMLAppBootstrapper, window, navigator, localStorage, document, setTimeout, main, JSLog, console */
'use strict';

(function(){

var logger = console;

window.HTMLAppBootstrapper = function(rootElement, jskitapp){
    if (this === undefined){
        return new HTMLAppBootstrapper(rootElement, jskitapp);
    }
    this.rootElement = rootElement;
    this.preflightID = jskitapp.preflightID;
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
    this._isInstalled = false;
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

    applicationLaunchResult: function(success){
        if (success){
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
        var src;
        for (src in this.scriptConfigs){
            if (src.length <= e.filename.length){
                if (e.filename.substr(e.filename.length - src.length) == src){
                    e.preventDefault();
                    this.caughtErrors.push(e);
                    this.scriptConfigs[src].compileError = e;
                    logger.error(e);
                    break;
                }
            }
        }
    },

    // MARK: - Service Worker

    _installUsingServiceWorker: function(container){
        var bootstrapper = this;
        container.getRegistration().then(function(registration){
            if (registration){
                bootstrapper.setStatus(HTMLAppBootstrapper.STATUS.checkingForUpdate);
                registration.update().then(function(registration){
                    if (registration.installing){
                        bootstrapper.setStatus(HTMLAppBootstrapper.STATUS.updating);
                        container.addEventListener('message', bootstrapper);
                        registration.installing.addEventListener('statechange', bootstrapper);
                    }else{
                        bootstrapper.load();
                    }
                });
            }else{
                bootstrapper.setStatus(HTMLAppBootstrapper.STATUS.installing);
                container.register(bootstrapper.serviceWorkerSrc).then(function(registration){
                    if (registration.installing){
                        container.addEventListener('message', bootstrapper);
                        registration.installing.addEventListener('statechange', bootstrapper);
                    }else{
                        bootstrapper.setStatus(HTMLAppBootstrapper.STATUS.updateError);
                    }
                }, function(error){
                    logger.error(error);
                    bootstrapper.setStatus(HTMLAppBootstrapper.STATUS.updateError);
                });
            }
        });
    },

    statechange: function(e){
        var worker = e.target;
        switch (worker.state){
            case "installed":
                if (this._hasLoaded){
                    // TODO: communicate to app
                }else{
                    worker.postMessage({type: "activate"});
                }
                break;
            case "activated":
                this.load();
                break;
        }
    },

    message: function(e){
        if (e.data.type == 'progress'){
            this.onprogress(e.data.loaded, e.data.total);
        }
    },

    // MARK: - Appcache

    _installUsingAppcache: function(appcache){
        this._isInstalled = window.applicationCache.status !== window.applicationCache.UNCACHED;
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
        logger.info('checking app cache...');
        this.setStatus(HTMLAppBootstrapper.STATUS.checkingForUpdate);
    },

    downloading: function(e){
        logger.info('cache downloading...');
        this.setStatus(this._isInstalled ? HTMLAppBootstrapper.STATUS.updating : HTMLAppBootstrapper.STATUS.installing);
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
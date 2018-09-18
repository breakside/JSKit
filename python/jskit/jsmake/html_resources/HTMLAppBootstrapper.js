/* global HTMLAppBootstrapper, window, navigator, localStorage, document, setTimeout, main, JSLog, console */
'use strict';

(function(){

var logger = console;//JSLog("bootstrap", "html");

window.HTMLAppBootstrapper = function(preflightID, preflightSrc, appSrc, appCss, rootElement){
    if (this === undefined){
        return new HTMLAppBootstrapper(preflightID, preflightSrc, appSrc, appCss, rootElement);
    }else{
        if (HTMLAppBootstrapper.mainBootstrapper !== null){
            throw Error("Only one bootstrapper can be started");
        }
        HTMLAppBootstrapper.mainBootstrapper = this;
        this.rootElement = rootElement;
        this.preflightID = preflightID;
        this.preflightSrc = preflightSrc;
        this.appSrc = appSrc;
        this.appCss = appCss;
        this.status = HTMLAppBootstrapper.STATUS.notstarted;
        this.statusDispatchTimeoutID = null;
        this.preflightChecks = [];
        this.minStatusInterval = 30;
        this.scriptConfigs = {};
        this.preflightStorageKey = this.preflightID;
        this.preflightStorageValue = navigator.userAgent;
        this.caughtErrors = [];
        this._isInstalled = false;
        window.addEventListener('error', this);
        window.JSGlobalObject = window;
    }
};

HTMLAppBootstrapper.mainBootstrapper = null;

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
        if (window.applicationCache){
            this._isInstalled = window.applicationCache.status !== window.applicationCache.UNCACHED;
            window.applicationCache.addEventListener('checking', this);
            window.applicationCache.addEventListener('downloading', this);
            window.applicationCache.addEventListener('noupdate', this);
            window.applicationCache.addEventListener('progress', this);
            window.applicationCache.addEventListener('error', this);
            window.applicationCache.addEventListener('updateready', this);
            window.applicationCache.addEventListener('cached', this);
            window.applicationCache.addEventListener('obsoleted', this);
        }else{
            this.load();
        }
    },

    load: function(){
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
                try {
                    bootstrapper.runApp();
                }catch (e){
                    bootstrapper.caughtErrors.push(e);
                    bootstrapper.setStatus(HTMLAppBootstrapper.STATUS.appRunError);
                    logger.error(e);
                }
                window.removeEventListener('error', this);
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

    checking: function(e){
        // logger.info('checking app cache...');
        this.setStatus(HTMLAppBootstrapper.STATUS.checkingForUpdate);
    },

    noupdate: function(e){
        // logger.info('no update');
        this.load();
    },

    downloading: function(e){
        // logger.info('cache downloading...');
        this.setStatus(this._isInstalled ? HTMLAppBootstrapper.STATUS.updating : HTMLAppBootstrapper.STATUS.installing);
    },

    progress: function(e){
        if (e.lengthComputable){
            this.onprogress(e.loaded, e.total);
        }else{
            // logger.info('progress is not length computable');
        }
    },

    cached: function(e){
        // logger.info('first version cached');
        this.load();
    },

    updateready: function(e){
        // logger.info('new version available...reloading page');
        window.location.reload();
    },

    obsoleted: function(e){
        // logger.info('cache obsoleted');
        this.load();
    }

};

})();
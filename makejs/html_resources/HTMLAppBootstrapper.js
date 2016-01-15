/* global window, navigator, localStorage, document, setTimeout, main */
'use strict';
function HTMLAppBootstrapper(preflightID, preflightSrc, appSrc, body){
    if (this === undefined){
        return new HTMLAppBootstrapper(preflightID, preflightSrc, appSrc, body);
    }else{
        if (HTMLAppBootstrapper.mainBootstrapper !== null){
            throw Error("Only one bootstrapper can be started");
        }
        HTMLAppBootstrapper.mainBootstrapper = this;
        this.preflightID = preflightID;
        this.body = body;
        this.preflightSrc = preflightSrc;
        this.appSrc = appSrc;
        this.status = HTMLAppBootstrapper.STATUS.notstarted;
        this.statusDispatchTimeoutID = null;
        this.preflightChecks = [];
        this.minStatusInterval = 100;
        this.scriptConfigs = {};
        this.preflightStorageKey = this.preflightID;
        this.preflightStorageValue = navigator.userAgent;
        this.caughtErrors = [];
        window.addEventListener('error', this);
    }
}

HTMLAppBootstrapper.mainBootstrapper = null;

HTMLAppBootstrapper.STATUS = {
    notstarted: 'notstarted',
    preflightLoading: 'preflightLoading',
    preflightRunning: 'preflightRunning',
    preflightLoadError: 'preflightLoadError',
    preflightFailedChecks: 'preflightFailedChecks',
    appLoading: 'appLoading',
    appLoadError: 'appLoadError',
    appRunError: 'appRunError',
    appRunning: 'appRunning'
};

HTMLAppBootstrapper.prototype = {

    // expected to be overridden by whatver code instantiates the bootstrapper, in order
    // to receive callbacks for status changes so the bootstrap UI can be updated
    onstatus: function(){
    },

    run: function(){
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
        this.includeAppSrc(this.appSrc.shift());
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
                }
                window.removeEventListener('error', this);
            }
        }, function HTMLAppBootstrapper_appScriptLoadError(){
            bootstrapper.setStatus(HTMLAppBootstrapper.STATUS.appLoadError);
        });
    },

    runApp: function(){
        main();
        this.setStatus(HTMLAppBootstrapper.STATUS.appRunning);
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
            this.body.appendChild(script);
        }catch (e){
            this.caughtErrors.push(e);
            errorCallback(e);
        }
    },

    setStatus: function(status){
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
        var src;
        for (src in this.scriptConfigs){
            if (src.length <= e.filename.length){
                if (e.filename.substr(e.filename.length - src.length) == src){
                    e.preventDefault();
                    this.caughtErrors.push(e);
                    this.scriptConfigs[src].compileError = e;
                    break;
                }
            }
        }
    },

};
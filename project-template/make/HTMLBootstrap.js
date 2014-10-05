function HTMLAppBootstrapper(preflightID, preflightSrc, appSrc, body){
    if (this === window){
        return new HTMLBootstrap(preflightID, preflightSrc, appSrc, body);
    }else{
        this.preflightID = preflightID;
        this.body = body;
        this.preflightSrc = preflightSrc;
        this.appSrc = appSrc;
        this.status = HTMLAppBootstrapper.STATUS.notstarted;
        this.preflightLoadError = null;
        this.appLoadError = null;
        this.appRunError = null;
    }
}

HTMLAppBootstrapper.STATUS = {
    notstarted: 'notstarted',
    preflightLoading: 'preflightLoading',
    preflightRunning: 'preflightRunning',
    preflightLoadError: 'preflightLoadError',
    preflightError: 'preflightError',
    appLoading: 'appLoading',
    appLoadError: 'appLoadError',
    appRunError: 'appRunError',
    appRunning: 'appRunning'
};

HTMLAppBootstrapper.prototype = {

    setStatus: function(status){
        this.status = status;
        var bootstrapper = this;
        setTimeout(function HTMLAppBootstrapper_dispatchStatusChanged(){
            bootstrapper.statusChanged();
        });
    },

    statusChanged: function(){
    },

    run: function(){
        if (!this.isPreflightOK()){
            this.preflight();
        }else{
            this.runApp();
        }
    },

    include: function(src, callback, errorCallback){
        try{
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.async = true;
            script.onload = callback;
            script.onerror = errorCallback;
            script.src = src;
            body.appendChildNode(script);
        }catch (e){
            errorCallback(e);
        }
    },

    preflight: function(){
        this.setStatus(HTMLAppBootstrapper.STATUS.preflightLoading);
        var bootstrapper = this;
        this.include(this.preflightSrc, function(){}, function HTMLAppBootstrapper_preflightLoadError(e){
            this.preflightLoadError = e;
            bootstrapper.setStatus(HTMLAppBootstrapper.STATUS.preflightLoadError);
        });
    },

    preflightStarted: function(){
        this.setStatus(HTMLAppBootstrapper.STATUS.preflightStarted);
    },

    preflightPassed: function(){
        this.runApp();
    },

    preflightFailed: function(failures){
        this.preflightFailures = failures;
        this.setStatus(HTMLAppBootstrapper.STATUS.preflightError);
    },

    runApp: function(){
        this.setStatus(HTMLAppBootstrapper.STATUS.appLoading);
        var bootstrapper = this;
        this.include(this.appSrc, function HTMLAppBootstrapper_appLoaded(){
            try{
                main();
            }catch (e){
                bootstrapper.appRunError = e;
                bootstrapper.setStatus(HTMLAppBootstrapper.STATUS.appRunError);
            }
        }, function HTMLAppBootstrapper_appLoadError(e){
            bootstrapper.appLoadError = e;
            bootstrapper.setStatus(HTMLAppBootstrapper.STATUS.appLoadError);
        });
    }

};
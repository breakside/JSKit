// #import "Promise+JS.js"
// #import "JSObject.js"
// #import "JSBundle.js"
// #import "JSRunLoop.js"
// #import "JSTimer.js"
// #import "JSFileManager.js"
// #import "JSLog.js"
'use strict';

(function(){

var logger = JSLog("foundation", "user-defaults");

JSClass("JSUserDefaults", JSObject, {

    identifier: JSReadOnlyProperty('_identifier', null),
    _defaults: null,
    _values: null,

    initWithIdentifier: function(identifier){
        this._identifier = identifier;
        this._url = JSFileManager.shared.persistentContainerURL.appendingPathComponents(['Preferences', '%s.prefs.json'.sprintf(this._identifier)]);
        this._defaults = {};
    },

    open: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        JSFileManager.shared.contentsAtURL(this._url, function(data){
            try{
                if (data !== null){
                    var json = String.initWithData(data, String.Encoding.utf8);
                    this._values = JSON.parse(json);
                }else{
                    this._values = {};
                }
            }catch (e){
                logger.warn("error with defaults data: %{error}", e);
                this._values = {};
            }
            completion.call(target, true);
        }, this);
        return completion.promise;
    },

    _open: function(){
        var self;
        return JSFileManager.shared.contentsAtURL(this._url).then(function(data){
            var json = String.initWithData(data, String.Encoding.utf8);
            self._values = JSON.parse(json);
        });
    },

    close: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        this._persist(function(success){
            if (success){
                this._values = null;
            }
            completion.call(target, success);
        }, this);
        return completion.promise;
    },

    // MARK: - Getting and Setting values

    valueForKey: function(key){
        if (key in this._values){
            return this._values[key];
        }
        if (key in this._defaults){
            return this._defaults[key];
        }
        return null;
    },

    setValueForKey: function(value, key){
        this._values[key] = value;
        this._persistAfterDelay();
        this._definePropertyForKey(key);
    },

    // MARK: - Register defaults

    registerDefaults: function(defaults){
        this._defaults = defaults;
        for (var key in defaults){
            this._definePropertyForKey(key);
        }
    },

    _definePropertyForKey: function(key){
        if (!(key in this)){
            Object.defineProperty(this, key, {
                get: function JSUserDefaults_getValue(){
                    return this.valueForKey(key);
                },
                set: function JSUserDefaults_setValue(value){
                    this.setValueForKey(value, key);
                }
            });
        }
    },

    // MARK: - Saving to Persistent Storage
    
    _persistScheduled: false,
    _persistTimer: null,
    _url: null,

    _persistAfterDelay: function(){
        if (this._persistScheduled){
            return;
        }
        this._persistScheduled = true;
        JSRunLoop.main.schedule(function(){
            if (this._persistScheduled){
                if (this._persistTimer !== null){
                    this._persistTimer.invalidate();
                }
                this._persistTimer = JSTimer.scheduledTimerWithInterval(1, this._persist, this);
                this._persistScheduled = false;
            }
        }, this);
    },

    _persist: function(completion, target){
        if (this._persistTimer !== null){
            this._persistTimer.invalidate();
        }
        this._persistTimer = null;
        if (this._values === null){
            completion.call(target, true);
        }else{
            var data = JSON.stringify(this._values).utf8();
            JSFileManager.shared.createFileAtURL(this._url, data, function(success){
                if (!success){
                    logger.error("Failed to write preferences to %{public}", this._url);
                }
                if (completion){
                    completion.call(target, success);
                }
            }, this);
        }
    }

});

Object.defineProperty(JSUserDefaults, 'shared', {
    configurable: true,
    get: function JSUserDefaults_getShared(){
        var shared = JSUserDefaults.initWithIdentifier(JSBundle.mainBundleIdentifier);
        Object.defineProperty(JSUserDefaults, 'shared', {value: shared});
        return shared;
    }
});
    
})();
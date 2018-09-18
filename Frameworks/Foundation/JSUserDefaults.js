// #import "Foundation/JSObject.js"
// #import "Foundation/JSBundle.js"
// #import "Foundation/JSRunLoop.js"
// #import "Foundation/JSTimer.js"
// #import "Foundation/JSFileManager.js"
// #import "Foundation/JSLog.js"
/* global Promise, JSClass, JSObject, JSReadOnlyProperty, JSUserDefaults, JSBundle, JSRunLoop, JSTimer, JSFileManager, JSLog */
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
        this._values = {};
    },

    open: function(completion, target){
        JSFileManager.shared.contentsAtURL(this._url, function(data){
            try{
                if (data !== null){
                    var json = String.initWithData(data, String.Encoding.utf8);
                    this._values = JSON.parse(json);
                }
            }catch (e){
            }
            completion.call(target);
        }, this);
    },

    _open: function(){
        var self;
        return JSFileManager.shared.contentsAtURL(this._url).then(function(data){
            var json = String.initWithData(data, String.Encoding.utf8);
            self._values = JSON.parse(json);
        });
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

    _persist: function(){
        this._persistTimer = null;
        var data = JSON.stringify(this._values).utf8();
        JSFileManager.shared.createFileAtURL(this._url, data, function(success){
            if (!success){
                logger.error("Failed to write preferences to %s".sprintf(this._url));
            }
        }, this);
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
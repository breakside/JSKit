// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
        JSFileManager.shared.contentsAtURL(this._url, function JSUserDefaults_open_contents(data){
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

    close: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        var needsSave = false;
        if (this._persistScheduled){
            this._persistScheduled = false;
            needsSave = true;
        }
        if (this._persistTimer !== null){
            this._persistTimer.invalidate();
            this._persistTimer = null;
            needsSave = true;
        }
        if (needsSave){
            this._persist(function JSUserDefaults_close_persisted(success){
                if (success){
                    this._values = null;
                }
                completion.call(target, success);
            }, this);
        }else{
            JSRunLoop.main.schedule(completion, target, true);
        }
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
    _persistDelay: 1,
    _url: null,

    _persistAfterDelay: function(){
        if (this._persistScheduled){
            return;
        }
        this._persistScheduled = true;
        JSRunLoop.main.schedule(function JSUserDefaults_persistAfterDelay_scheduled(){
            if (this._persistScheduled){
                if (this._persistTimer !== null){
                    this._persistTimer.invalidate();
                }
                this._persistTimer = JSTimer.scheduledTimerWithInterval(this._persistDelay, this._persist, this);
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
            if (completion){
                completion.call(target, true);
            }
        }else{
            var data = JSON.stringify(this._values).utf8();
            logger.info("saving user defaults");
            JSFileManager.shared.createFileAtURL(this._url, data, function JSUserDefaults_persist_createFile(success){
                if (!success){
                    logger.error("failed to write user defaults");
                }else{
                    logger.info("saved user defaults");
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
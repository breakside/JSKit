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
    _fileManager: null,
    _defaults: null,
    _values: null,

    initWithIdentifier: function(identifier, fileManager){
        if (fileManager === undefined){
            fileManager = JSFileManager.shared;
        }
        this._fileManager = fileManager;
        this._identifier = identifier;
        this._url = this._fileManager.persistentContainerURL.appendingPathComponents(['Preferences', '%s.prefs.json'.sprintf(this._identifier)]);
        this._defaults = {};
    },

    open: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        this._fileManager.contentsAtURL(this._url, function JSUserDefaults_open_contents(data){
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
        this.synchronize(function(success){
            if (success){
                this._values = null;
            }
            completion.call(target, success);
        }, this);
        return completion.promise;
    },

    synchronize: function(completion, target){
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
                completion.call(target, success);
            }, this);
        }else{
            JSRunLoop.main.schedule(completion, target, true);
        }
        return completion.promise;
    },

    // MARK: - Getting and Setting values

    valueForKey: function(key){
        if (this._values === null){
            throw new Error("JSUserDefaults is closed, cannot get value.  Be sure to call open() first.");
        }
        if (key in this._values){
            return this._values[key];
        }
        if (key in this._defaults){
            return this._defaults[key];
        }
        return null;
    },

    setValueForKey: function(value, key){
        if (this._values === null){
            throw new Error("JSUserDefaults is closed, cannot set value.  Be sure to call open() first.");
        }
        this._values[key] = value;
        this._persistAfterDelay();
        this._definePropertyForKey(key);
    },

    deleteValueForKey: function(key){
        if (this._values === null){
            throw new Error("JSUserDefaults is closed, cannot set value.  Be sure to call open() first.");
        }
        delete this._values[key];
        this._persistAfterDelay();
    },

    // MARK: - Register defaults

    registerDefaults: function(defaults){
        for (var key in defaults){
            this._defaults[key] = defaults[key];
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
                    this.willChangeValueForKey(key);
                    this.setValueForKey(value, key);
                    this.didChangeValueForKey(key);
                }
            });
        }
    },

    defineObservablePropertyForKey: function(){
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
            this._fileManager.createFileAtURL(this._url, data, function JSUserDefaults_persist_createFile(success){
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
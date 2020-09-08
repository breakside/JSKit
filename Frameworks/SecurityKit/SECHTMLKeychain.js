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

// #import "SECKeychain.js"
// jshint browser: true
'use strict';

(function(){

JSClass("SECHTMLKeychain", JSObject, {

    initWithCredentialStore: function(credentialStore, origin){
        SECHTMLKeychain.$super.init.call(this);
        if (credentialStore !== undefined){
            this.credentialStore = credentialStore;
        }
        this.origin = origin;
    },

    credentialStore: null,
    origin: null,
    onlyItemId: "html",

    isLocked: function(){
        return false;
    },

    close: function(completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        JSRunLoop.main.schedule(completion, target);
        return completion.promise;
    },

    unlock: function(password, completion, target){
        throw new Error("Cannot unlock an HTML device keychain");
    },

    lock: function(){
        throw new Error("Cannot lock an HTML device keychain");
    },

    changeMasterPassword: function(oldPassword, newPassword, completion, target){
        throw new Error("Cannot change master password of HTML device keychain");
    },

    contains: function(itemId){
        return itemId === this.onlyItemId;
    },

    remove: function(itemId, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        JSRunLoop.main.schedule(completion, target, false);
        return completion.promise;
    },

    get: function(itemId, completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        if (itemId !== this.onlyItemId || this.credentialStore === null){
            JSRunLoop.main.schedule(completion, target, null);
            return;
        }
        this.credentialStore.get({password: true}).then(function(credential){
            if (!credential || credential.type != "password"){
                completion.call(target, null);
                return;
            }
            completion.call(target, {id: itemId, username: credential.id, password: credential.password});
        }, function(error){
            completion.call(target, null);
        });
        return completion.promise;
    },

    add: function(item, completion, target){
        return this.rememberPasswordCredential(item, completion, target);
    },

    update: function(item, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        if (!this.contains(item.id)){
            throw new Error("Missing item");
        }
        this.rememberPasswordCredential(item, completion, target);
        return completion.promise;
    },

    rememberPasswordCredential: function(item, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        if (this.credentialStore === null || !item.username || !item.password){
            JSRunLoop.main.schedule(completion, target, null);
            return;
        }
        var info = {
            id: item.username,
            password: item.password,
            origin: item.origin || this.origin
        };
        var id = this.onlyItemId;
        var credentialStore = this.credentialStore;
        credentialStore.create({password: info}).then(function(credential){
            if (!credential || credential.type  != "password"){
                completion.call(target, null);
                return;
            }
            credentialStore.store(credential).then(function(){
                completion.call(target, id);
            }, function(error){
                completion.call(target, null);
            });
        }, function(error){
            completion.call(target, null);
        });
        return completion.promise;
    },

});

Object.defineProperties(SECKeychain, {
    device: {
        configurable: true,
        get: function SECHTMLKeychain_getShared(){
            var device = SECHTMLKeychain.initWithCredentialStore(navigator.credentials, location.origin);
            Object.defineProperty(SECKeychain, "device", {value: device});
            return device;
        }
    }
});

})();
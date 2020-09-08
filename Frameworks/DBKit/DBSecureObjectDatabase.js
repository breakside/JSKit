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

// #import "DBObjectDatabase.js"
// #import SecurityKit
'use strict';

(function(){

var logger = JSLog("dbkit", "database");

JSClass("DBSecureObjectDatabase", DBObjectDatabase, {

    initWithKeystore: function(keystore, store){
        this.initWithObjectStore(store);
        this.keystore = keystore;
    },

    defaultKeyName: null,
    defaultAlgorithm: SECCipher.Algorithm.aesCBC,
    defaultKeyBitLength: 256,
    keystore: null,

    decryptObject: function(encryptedObject, completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        if (encryptedObject.version !== 1){
            completion.call(target, null);
            return;
        }
        var cipher = SECCipher.initWithAlgorithm(encryptedObject.algorithm, encryptedObject.keyBitLength);
        cipher.createKeyWithName(encryptedObject.keyName, this.keystore, function(key){
            if (key === null){
                completion.call(target, null);
                return;
            }
            var encrypted = encryptedObject.encrypted.dataByDecodingBase64();
            cipher.decryptString(encrypted, key, function(json){
                key.destroy();
                if (json === null){
                    completion.call(target, null);
                    return;
                }
                var object = null;
                try{
                    object = JSON.parse(json);
                }catch (e){
                }
                completion.call(target, object);
            }, this);
        }, this);
        return completion.promise;
    },

    encryptObject: function(obj, keyName, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        var cipher = SECCipher.initWithAlgorithm(this.defaultAlgorithm, this.defaultKeyBitLength);
        cipher.createKeyWithName(keyName, this.keystore, function(key){
            if (key === null){
                completion.call(target, false);
                return;
            }
            var json = JSON.stringify(obj);
            cipher.encryptString(json, key, function(encrypted){
                key.destroy();
                if (encrypted === null){
                    completion.call(target, false);
                    return;
                }
                var encryptedObject = {
                    id: obj.id,
                    version: 1,
                    keyName: keyName,
                    algorithm: cipher.algorithm,
                    keyBitLength: cipher.keyBitLength,
                    encrypted: encrypted.base64StringRepresentation()
                };
                completion.call(target, encryptedObject);
            }, this);
        }, this);
        return completion.promise;
    },

    object: function(id, completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        this.store.object(id, function(encryptedObject){
            if (encryptedObject === null){
                completion.call(target, null);
                return;
            }
            this.decryptObject(encryptedObject, completion, target);
        }, this);
        return completion.promise;
    },

    save: function(obj, completion, target){
        return this.saveUsingKey(obj, this.defaultKeyName, completion, target);
    },

    saveUsingKey: function(obj, keyName, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        this.encryptObject(obj, keyName, function(encryptedObject){
            if (encryptedObject === null){
                completion.call(target, false);
                return;
            }
            this.store.save(encryptedObject, completion, target);
        }, this);
        return completion.promise;
    },

    saveExpiring: function(obj, lifetimeInSeconds, completion, target){
        return this.saveExpiringUsingKey(obj, lifetimeInSeconds, this.defaultKeyName, completion, target);
    },

    saveExpiringUsingKey: function(obj, lifetimeInSeconds, keyName, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        if (this.store.isKindOfClass(DBEphemeralObjectStore)){
            this.encryptObject(obj, keyName, function(encryptedObject){
                if (encryptedObject === null){
                    completion.call(target, false);
                    return;
                }
                this.store.saveExpiring(encryptedObject, lifetimeInSeconds, completion, target);
            }, this);
        }else{
            logger.error("Cannot save expiring object in a persistent data store");
            JSRunLoop.main.schedule(completion, target, false);
        }
        return completion.promise;
    },

    setKeystore: function(keystore){
        throw new Error("Cannot set the keystore of a secure database");
    }

});

})();
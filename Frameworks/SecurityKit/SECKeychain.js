// #import "Foundation/Foundation.js"
// #import "Foundation/JSFileManager.js"
// #import "SecurityKit/SECCipher.js"
// #import "SecurityKit/SECKey.js"
/* global JSClass, JSObject, UUID, JSCopy, JSReadOnlyProperty, JSFileManager, JSRunLoop, JSTimer, SECCipher, SECKey, JSLog */
'use strict';

(function(){

var logger = JSLog("security", "keychain");

JSClass("SECKeychain", JSObject, {

    identifier: JSReadOnlyProperty('_identifier'),

    // --------------------------------------------------------------------
    // MARK: - Creating a Keychain

    initWithIdentifier: function(identifier, fileManager){
        this._fileManager = fileManager || JSFileManager.shared;
        this._identifier = identifier;
        this._url = this._fileManager.persistentContainerURL.appendingPathComponents(['Keychain', "%s.keychain.json".sprintf(this._identifier)]);
        this._contents = null;
        this._methods = null;
    },

    create: function(password, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        // 1. Use the given password to derive an encryption key that will
        //    encrypt the item encryption keys.  This level of indirection allows a user
        //    to change the password later, without re-encrypting the whole database;
        //    only the item encryption keys would need to be re-encrypted
        //    NOTE: Using AES-GCM here becuase it includes message authentication,
        //    and will fail decryption if the user provides a wrong password.  Other
        //    methods without additional message authentication will decrypt invalid
        //    data, which isn't as obvious a failure.
        var masterAlgorithm = SECCipher.Algorithm.aesGaloisCounterMode;
        var masterCipher = SECCipher.initWithAlgorithm(masterAlgorithm);
        var masterSalt = SECCipher.getRandomData(16);
        masterCipher.createKeyWithPassphrase(password, masterSalt, function(masterKey){
            if (masterKey !== null){
                // 2. Create a key for encrypting items
                //    We'll start with just a single method for encrypting items.  Future use
                //    cases may require that a new keychain start with multiple methods
                //    (for example, if we want to use different algorithms to encrypt different
                //    types of items), but a single item encryption method supports our basic initial use case.
                //    NOTE: Using AES-CBC here so we don't have to worry about reusing nonces like in
                //    counter mode.
                //    TODO: Incorporate a message auth system since we're using CBC, which doesn't include
                //    its own auth like GCM.  Need a generic SECDiget API first.
                var methodAlgorithm = SECCipher.Algorithm.aesCipherBlockChaining;
                var methodCipher = SECCipher.initWithAlgorithm(methodAlgorithm);
                methodCipher.createKey(function(methodKey){
                    if (methodKey !== null){
                        // 3. Wrap the method key with the password derived key for secure storage
                        masterCipher.wrapKey(methodKey, masterKey, function(wrappedMethodKeyData){
                            if (wrappedMethodKeyData !== null){
                                // 4. Populate the encrypted JSON format that will be saved to disk
                                this._contents = {
                                    masterAlgorithm: masterAlgorithm,
                                    masterSalt: masterSalt.base64StringRepresentation(),
                                    methods: [{algorithm: methodAlgorithm, key: wrappedMethodKeyData.base64StringRepresentation()}],
                                    preferredMethod: 0,
                                    items: {}
                                };
                                // 5. Save to disk
                                this._persist(function(success){
                                    if (success){
                                        // 6. Populate our decrypted methods, leaving the keychain in an unlocked
                                        //    state all ready to go
                                        this._methods = [new KeychainMethod(methodAlgorithm, methodKey)];
                                    }else{
                                        this._contents = null;
                                    }
                                    completion.call(target, success);
                                }, this);
                            }else{
                                completion.call(target, false);
                            }
                        }, this);
                    }else{
                        completion.call(target, false);
                    }
                }, this);
            }else{
                completion.call(target, false);
            }
        }, this);
        return completion.promise;
    },

    // --------------------------------------------------------------------
    // MARK: - Unlocking & Locking the Keychain

    unlock: function(password, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        if (this._methods === null){
            var unlockHandler = function(unlockedMethods){
                if (unlockedMethods !== null){
                    this._methods = unlockedMethods;
                    completion.call(target, true);
                }else{
                    completion.call(target, false);
                }
            };
            if (this._contents === null){
                this._open(function(success){
                    if (success){
                        this._unlockOpened(password, unlockHandler, this);
                    }else{
                        completion.call(target, false);
                    }
                }, this);
            }else{
                this._unlockOpened(password, unlockHandler, this);
            }
        }else{
            JSRunLoop.main.schedule(completion, target, true);
        }
        return completion.promise;
    },

    _unlockOpened: function(password, completion, target){
        var unlockedMethods = [];
        try{
            var masterAlgorithm = this._contents.masterAlgorithm;
            var masterCipher = SECCipher.initWithAlgorithm(masterAlgorithm);
            var masterSalt = this._contents.masterSalt.dataByDecodingBase64();
            masterCipher.createKeyWithPassphrase(password, masterSalt, function(masterKey){
                var methodIndex = 0;
                var decryptNextMethod = function(){
                    if (methodIndex == this._contents.methods.length){
                        completion.call(target, unlockedMethods);
                    }else{
                        var methodInfo = this._contents.methods[methodIndex];
                        try{
                            var wrappedMethodKeyData = methodInfo.key.dataByDecodingBase64();
                            masterCipher.unwrapKey(wrappedMethodKeyData, methodInfo.algorithm, masterKey, function(methodKey){
                                if (methodKey !== null){
                                    unlockedMethods.push(new KeychainMethod(methodInfo.algorithm, methodKey));
                                    ++methodIndex;
                                    decryptNextMethod.call(this);
                                }else{
                                    completion.call(target, null);
                                }
                            }, this);
                        }catch (e){
                            completion.call(target, null);
                        }
                    }
                };
                decryptNextMethod.call(this);
            }, this);
        }catch (e){
            completion.call(target, null);
        }
    },

    locked: JSReadOnlyProperty(null, 'isLocked'),

    isLocked: function(){
        return this._methods === null;
    },

    lock: function(){
        this._methods = null;
    },

    close: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        this.lock();
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
            this._persist(completion, target);
        }else{
            JSRunLoop.main.schedule(completion, target, true);
        }
        return completion.promise;
    },

    // --------------------------------------------------------------------
    // MARK: - Changing the Master Password

    changeMasterPassword: function(oldPassword, newPassword, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        this._unlockOpened(oldPassword, function(unlockedMethods){
            if (unlockedMethods !== null){
                var masterAlgorithm = SECCipher.Algorithm.aesGaloisCounterMode;
                var masterCipher = SECCipher.initWithAlgorithm(masterAlgorithm);
                var masterSalt = SECCipher.getRandomData(16);
                masterCipher.createKeyWithPassphrase(newPassword, masterSalt, function(masterKey){
                    if (masterKey !== null){
                        var methodIndex = 0;
                        var lockedMethods = [];
                        var encryptNextMethod = function(){
                            if (methodIndex == this._methods.length){
                                this._contents.masterAlgorithm = masterAlgorithm;
                                this._contents.masterSalt = masterSalt.base64StringRepresentation();
                                this._contents.methods = lockedMethods;
                                this._persistAfterDelay();
                                completion.call(target, true);
                            }else{
                                var method = this._methods[methodIndex];
                                masterCipher.wrapKey(method.key, masterKey, function(wrappedMethodKeyData){
                                    if (wrappedMethodKeyData !== null){
                                        var methodInfo = {
                                            algorithm: method.algorithm,
                                            key: wrappedMethodKeyData.base64StringRepresentation()
                                        };
                                        lockedMethods.push(methodInfo);
                                        ++methodIndex;
                                        encryptNextMethod.call(this);
                                    }else{
                                        completion.call(target, false);
                                    }
                                }, this);
                            }
                        };
                        encryptNextMethod.call(this);
                    }else{
                        completion.call(target, false);
                    }
                }, this);
            }else{
                completion.call(target, false);
            }
        }, this);
        return completion.promise;
    },

    // --------------------------------------------------------------------
    // MARK: - Fetching Items

    contains: function(itemID){
        if (this.locked){
            return false;
        }
        return itemID in this._contents.items;
    },

    get: function(itemID, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        if (this.locked || !this.contains(itemID)){
            JSRunLoop.main.schedule(completion, target, null);
            return completion.promise;
        }
        try{
            var itemInfo = this._contents.items[itemID];
            var method = this._methods[itemInfo.method];
            if (!method){
                throw new Error("Invalid method (%d) for item %s".sprintf(itemInfo.method, itemID));
            }
            var encryptedItemData = itemInfo.data.dataByDecodingBase64();
            method.decrypt(encryptedItemData, function(decrypted){
                var item = null;
                try {
                    var json = String.initWithData(decrypted, String.Encoding.utf8);
                    item = JSON.parse(json);
                    item.id = itemID;
                }catch (e){
                }
                completion.call(target, item);
            }, this);
        }catch (e){
            logger.error(e);
            JSRunLoop.main.schedule(completion, target, null);
        }
        return completion.promise;
    },

    // --------------------------------------------------------------------
    // MARK: - Updating Items

    add: function(item, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        if (this.locked){
            JSRunLoop.main.schedule(completion, target, null);
            return completion.promise;
        }
        var id = UUID();
        var methodIndex = this._preferredMethodForItem(item, null);
        this._saveItem(id, item, methodIndex, completion, target);
        return completion.promise;
    },

    update: function(item, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        if (this.locked){
            JSRunLoop.main.schedule(completion, target, null);
            return completion.promise;
        }
        var id = item.id;
        try{
            if (!this.contains(id)){
                throw new Error("Missing item");
            }
            var itemInfo = this._contents.items[id];
            var methodIndex = this._preferredMethodForItem(item, itemInfo.method);
            this._saveItem(id, item, methodIndex, completion, target);
        }catch (e){
            logger.error(e);
            JSRunLoop.main.schedule(completion, target, null);
        }
        return completion.promise;
    },

    _preferredMethodForItem: function(item, existingMethod){
        if (existingMethod){
            return existingMethod;
        }
        return this._contents.preferredMethod || (this._methods.length - 1);
    },

    _saveItem: function(id, item, methodIndex, completion, target){
        try{
            var method = this._methods[methodIndex];
            if (!method){
                throw new Error("Invalid method: %d".sprintf(methodIndex));
            }
            var itemCopy = JSCopy(item);
            if ('id' in itemCopy){
                delete itemCopy.id;
            }
            var itemData = JSON.stringify(itemCopy).utf8();
            method.encrypt(itemData, function(encrypted){
                try{
                    var itemInfo = {
                        method: methodIndex,
                        data: encrypted.base64StringRepresentation()
                    };
                    this._contents.items[id] = itemInfo;
                }catch (e){
                    id = null;
                }
                if (id !== null){
                    this._persistAfterDelay();
                }
                completion.call(target, id);
            }, this);
        }catch (e){
            logger.error(e);
            JSRunLoop.main.schedule(completion, target, null);
        }
    },

    remove: function(itemID, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        if (this.locked){
            JSRunLoop.main.schedule(completion, target, false);
            return completion.promise;
        }
        if (this.contains(itemID)){
            delete this._contents.items[itemID];
            this._persistAfterDelay();
        }
        JSRunLoop.main.schedule(completion, target, true);
        return completion.promise;
    },

    // --------------------------------------------------------------------
    // MARK: - Encryption

    _methods: null,

    // MARK: - Saving to Persistent Storage
    
    _contents: null,
    _persistScheduled: false,
    _persistTimer: null,
    _url: null,

    _persistAfterDelay: function(){
        if (this._persistScheduled){
            return;
        }
        this._persistScheduled = true;
        logger.info("persistAfterDelay");
        JSRunLoop.main.schedule(function(){
            logger.info("persistAfterDelay runLoop");
            if (this._persistScheduled){
                if (this._persistTimer !== null){
                    this._persistTimer.invalidate();
                }
                logger.info("persistAfterDelay creating timer");
                this._persistTimer = JSTimer.scheduledTimerWithInterval(1, this._persist, this);
                this._persistScheduled = false;
            }
        }, this);
    },

    _persist: function(completion, target){
        logger.info("persisting keychain");
        this._persistTimer = null;
        var data = JSON.stringify(this._contents).utf8();
        this._fileManager.createFileAtURL(this._url, data, function(success){
            if (!success){
                logger.error("Failed to write keychain to %{public}", this._url);
            }else{
                logger.info("keychain saved");
            }
            if (completion){
                completion.call(target, success);
            }
        }, this);
    },

    _open: function(completion, target){
        this._fileManager.contentsAtURL(this._url, function(data){
            if (data !== null){
                try{
                    var json = String.initWithData(data, String.Encoding.utf8);
                    this._contents = JSON.parse(json);
                    try{
                        completion.call(target, true);
                    }catch(e){
                    }
                }catch (e){
                    completion.call(target, false);
                }
            }
        }, this);
    }

});

var KeychainMethod = function(algorithm, key){
    if (this === undefined){
        return new KeychainMethod(algorithm, key);
    }
    this.algorithm = algorithm;
    this.key = key;
};

KeychainMethod.prototype = {

    encrypt: function(data, completion, target){
        var cipher = this._createCipher();
        cipher.encrypt(data, this.key, completion, target);
    },

    decrypt: function(data, completion, target){
        var cipher = this._createCipher();
        cipher.decrypt(data, this.key, completion, target);
    },

    _createCipher: function(){
        return SECCipher.initWithAlgorithm(this.algorithm);
    }

};

})();
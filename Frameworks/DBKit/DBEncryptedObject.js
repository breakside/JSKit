// #import SecurityKit
"use strict";

(function(){

var logger = JSLog("dbkit", "encrypted");

JSClass("DBEncryptedObject", JSObject, {

    id: null,
    version: 1,
    algorithm: null,
    keyIdentifier: null,
    keyBitLength: null,
    encrypted: null,

    keystore: null,
    objectClass: null,
    object: null,
    graph: null,

    initWithObject: function(object){
        this.id = object.id;
        this.object = object;
    },

    initFromStorableDictionary: function(dictionary){
        this.version = dictionary.version;
        this.algorithm = dictionary.algorithm;
        this.keyIdentifier = dictionary.keyIdentifier;
        this.keyBitLength = dictionary.keyBitLength;
        this.encrypted = dictionary.encrypted.dataByDecodingBase64();
    },

    encodeToStorableDictionary: function(dictionary){
        dictionary.version = this.version;
        dictionary.algorithm = this.algorithm;
        dictionary.keyIdentifier = this.keyIdentifier;
        dictionary.keyBitLength = this.keyBitLength;
        dictionary.encrypted = this.encrypted.base64StringRepresentation();
    },

    awakeInGraph: function(graph){
        if (this.objectClass && this.objectClass.prototype.awakeInGraph){
            this.graph = graph;
        }
    },

    encrypt: function(algorithm, keyIdentifier, keyBitLength, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        var cipher = SECCipher.initWithAlgorithm(algorithm, keyBitLength);
        var key = cipher.createKeyFromKeystore(this.keystore, keyIdentifier, function(key){
            if (key === null){
                completion.call(target, false);
                return;
            }
            var storable = this.object;
            if (storable.encodeToStorableDictionary){
                var dictionary = {
                    id: storable.id
                };
                storable.encodeToStorableDictionary(dictionary);
                storable = dictionary;
            }
            var json = JSON.stringify(storable);
            cipher.encryptString(json, key, function(encrypted){
                key.destroy();
                if (encrypted === null){
                    completion.call(target, false);
                    return;
                }
                this.algorithm = algorithm;
                this.keyIdentifier = keyIdentifier;
                this.keyBitLength = keyBitLength;
                this.encrypted = encrypted;
                completion.call(target, true);
            }, this);
        }, this);
        return completion.promise;
    },

    decrypt: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        if (this.object === null && this.encrypted !== null && this.keystore !== null){
            var cipher = SECCipher.initWithAlgorithm(this.algorithm, this.keyBitLength);
            cipher.createKeyFromKeystore(this.keystore, this.keyIdentifier, function(key){
                if (key === null){
                    completion.call(target, null);
                    return;
                }
                cipher.decryptString(this.encrypted, key, function(json){
                    key.destroy();
                    if (json === null){
                        completion.call(target, null);
                        return;
                    }
                    var dictionary = null;
                    try{
                        dictionary = JSON.parse(json);
                    }catch (e){
                        completion.call(target, null);
                        return;
                    }
                    var storable = dictionary;
                    if (this.objectClass){
                        storable = this.objectClass.initFromStorableDictionary(dictionary);
                        storable.id = dictionary.id;
                    }
                    this.object = storable;
                    if (this.graph !== null){
                        if (storable.awakeInGraph){
                            var promise = storable.awakeInGraph(this.graph);
                            if (promise instanceof Promise){
                                promise.then(function(){
                                    completion.call(target, storable);
                                });
                                return;
                            }
                        }
                    }
                    completion.call(target, this.object);
                }, this);
            }, this);
        }else{
            completion.call(target, this.object);
        }
        return completion.promise;
    }

});

})();
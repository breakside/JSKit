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

/* global setTimeout */
'use strict';

(function(){

// Most browsers and environments already implement Promise, but a few do not.
// The following code will polyfill the Promise class.  Since the environments
// without Promise are rare, it can be easier to test this code in a browser
// that supports Promise, but doing so requires chaning the class name.
// 1. Change both instances of JSGlobalObject.Promise to JSGlobalObject.JSPromise
// 2. Change PromiseTests.js to match.
// Now any environment will have our completely custom JSPromise class, which can
// be tested for correct behavior without tracking down an old browser.
var PromiseClass = JSGlobalObject.Promise;

if (!PromiseClass){

    var setImmediate = JSGlobalObject.setImmediate;

    if (!setImmediate){
        setImmediate = function(callback){
            setTimeout(callback, 10);
        };
    }

    PromiseClass = JSGlobalObject.Promise = function(executor){
        if (this === undefined){
            throw new Error("Promise must be constructed with the new operator");
        }
        this._listeners = [];
        var self = this;
        var executorFinished = false;
        var resolveOrRejectCalled = false;
        var resolve = function(value){
            if (resolveOrRejectCalled){
                throw new Error("Promise already resolved or rejected");
            }
            resolveOrRejectCalled = true;
            var actuallyResolve = function(){
                self._state = PromiseClass.State.fulfilled;
                self._value = value;
                for (var i = 0, l = self._listeners.length; i < l; ++i){
                    self._callListener(self._listeners[i]);
                }
            };
            if (executorFinished){
                actuallyResolve();
            }else{
                setImmediate(actuallyResolve);
            }
        };
        var reject = function(reason){
            if (resolveOrRejectCalled){
                throw new Error("Promise already resolved or rejected");
            }
            resolveOrRejectCalled = true;
            var actuallyReject = function(){
                self._state = PromiseClass.State.rejected;
                self._value = reason;
                for (var i = 0, l = self._listeners.length; i < l; ++i){
                    self._callListener(self._listeners[i]);
                }
            };
            if (executorFinished){
                actuallyReject();
            }else{
                setImmediate(actuallyReject);
            }
        };
        try{
            executor(resolve, reject);
        }catch(e){
            reject(e);
        }
        executorFinished = true;
    };

    PromiseClass.prototype = {

        then: function(successBlock, errorBlock){
            var self = this;
            return new PromiseClass(function(resolve, reject){
                var listener = {
                    resolve: resolve,
                    reject: reject,
                    successBlock: successBlock,
                    errorBlock: errorBlock
                };
                self._listeners.push(listener);
                switch (self.state){
                    case PromiseClass.State.pending:
                        break;
                    case PromiseClass.State.fulfilled:
                    case PromiseClass.State.rejected:
                        setImmediate(function(){
                            self._callListener(listener);
                        });
                        break;
                }
            });
        },

        catch: function(errorBlock){
            return this.then(undefined, errorBlock);
        },

        _listeners: null,
        _value: undefined,
        _state: 0,

        _callListener: function(listener){
            var result;
            var block;
            if (this._state == PromiseClass.State.fulfilled){
                result = this._value;
                block = listener.successBlock;
            }else{
                result = PromiseClass.reject(this._value);
                block = listener.errorBlock;
            }
            try{
                if (block){
                    result = block(this._value);
                }
                if (result instanceof PromiseClass){
                    result.then(listener.resolve, listener.reject);
                }else{
                    listener.resolve(result);
                }
            }catch (e){
                listener.reject(e);
            }
        }

    };

    PromiseClass.all = function(promises){
        return new PromiseClass(function(resolve, reject){
            var promise;
            var remaining = 0;
            var values = [];
            var rejected = false;
            var succcess = function(value){
                if (rejected) return;
                values.push(value);
                --remaining;
                if (remaining === 0){
                    resolve(values);
                }
            };
            var error = function(reason){
                if (rejected) return;
                rejected = true;
                reject(reason);
            };
            for (var i = 0, l = promises.length; i < l; ++i){
                promise = promises[i];
                if (promise instanceof PromiseClass){
                    ++remaining;
                    promise.then(succcess, error);
                }
            }
        });
    };

    PromiseClass.race = function(promises){
        return new PromiseClass(function(resolve, reject){
            var promise;
            var resolvedOrRejected = false;
            var succcess = function(value){
                if (resolvedOrRejected) return;
                resolvedOrRejected = true;
                resolve(value);
            };
            var error = function(reason){
                if (resolvedOrRejected) return;
                resolvedOrRejected = true;
                reject(reason);
            };
            for (var i = 0, l = promises.length; i < l; ++i){
                promise = promises[i];
                if (promise instanceof PromiseClass){
                    promise.then(succcess, error);
                }
            }
        });
    };

    PromiseClass.resolve = function(value){
        return new PromiseClass(function(resolve, reject){
            if (value instanceof PromiseClass){
                value.then(resolve, reject);
            }else{
                resolve(value);
            }
        });
    };

    PromiseClass.reject = function(reason){
        return new PromiseClass(function(resolve, reject){
            reject(reason);
        });
    };

    PromiseClass.State = {
        pending: 0,
        fulfilled: 1,
        rejected: 2
    };

}


// Some browsers have most of the Promise class implemented, but are missing
// the finally method, so we'll check for it separately than the class as a whole.
// Our polyfill above does not implement .finally, because we'll catch that here.
if (!PromiseClass.prototype.finally){

    PromiseClass.prototype.finally = function(block){
        return this.then(function(value){
            block();
            return PromiseClass.resolve(value);
        }, function(reason){
            block();
            return PromiseClass.reject(reason);
        });
    };

}

Object.defineProperties(PromiseClass, {

    completion: {
        value: function(thenfn, errorMessage){
            var completion = function Promise_handleCompletion(){
                var values = Array.prototype.slice.call(arguments, 0);
                completion.resolve(values.length == 1 ? values[0] : values);
            };
            completion.promise = new Promise(function(resolve, reject){
                completion.resolve = resolve;
                completion.reject = reject;
            });
            if (thenfn){
                completion.promise = completion.promise.then(thenfn);
                if (errorMessage){
                    completion.promise = completion.promise.then(function(r){
                        return r;
                    }, function(e){
                        if (!e){
                            e = new Error(errorMessage);
                        }
                        return Promise.reject(e);
                    });
                }
            }
            return completion;
        }
    },

    resolveNonNull: {
        value: function(result){
            if (result === null){
                return Promise.reject(new Error("expecting non-null result"));
            }
            return result;
        }
    },

    resolveNull: {
        value: function(result){
            if (result !== null){
                return Promise.reject(result);
            }
            return result;
        }
    },

    resolveTrue: {
        value: function(result){
            if (!result){
                return Promise.reject(new Error("expecting true result"));
            }
        }
    },

    resolveKeyed: {
        value: function(){
            var keys = Array.prototype.slice.call(arguments, 0);
            return function(values){
                var result = {};
                for (var i = 0, l = keys.length; i < l; ++i){
                    result[keys[i]] = values[i];
                }
                return result;
            };
        }
    }

});
    
})();
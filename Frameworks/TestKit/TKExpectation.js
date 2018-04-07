// #import "Foundation/Foundation.js"
/* global JSClass, JSObject, JSTimer */
'use strict';

JSClass("TKExpectation", JSObject, {

    error: null,
    timeoutTimer: null,
    isDone: false,
    _catchFn: null,
    _finallyFn: null,

    init: function(){
    },

    /// Calls the target function, wrapping any callbacks
    ///
    /// We want to wrap callbacks for a couple reasons:
    /// 1. So we can catch any errors, including TKAsserts, in the callback (this is something promises can't do)
    /// 2. So we can ingore the callback if a timeout occurs (also something promises can't do)
    call: function(fn, target){
        var args = Array.prototype.slice.call(arguments, 2);
        for (var i = 0; i < args.length; ++i){
            if (typeof(args[i]) == "function"){
                args[i] = this._wrapCallback(args[i]);
            }
        }
        return fn.apply(target, args);
    },

    /// Start a timer that can interrupt the async process early
    ///
    /// Typically called automatically by TKTestSuite.wait, a timeout ensures that
    /// the test won't get stuck forever, while also enforcing strict async timing requirements
    setTimeout: function(timeout){
        this.timeoutTimer = JSTimer.initWithInterval(timeout, false, function(){
            this.error = new Error("Expectation took longer than %f seconds".sprintf(timeout));
            this.timeoutTimer = null;
            this._finish();
        }, this);
        this.timeoutTimer.schedule();
    },

    /// Catch any error that occurs, including timeout
    ///
    /// Typically called internally by TKTestRun
    catch: function(fn){
        this._catchFn = fn;
        if (this.isDone){
            this._finish();
        }
        return this;
    },

    /// Called after the expecation is done, either because of an error or because it was fulfilled
    ///
    /// Called after `catch()`.
    ///
    /// Typically called internally by TKTestRun
    finally: function(fn){
        this._finallyFn = fn;
        if (this.isDone){
            this._finish();
        }
        return this;
    },

    _finish: function(){
        this.isDone = true;
        var catchFn = this._catchFn;
        var finallyFn = this._finallyFn;
        this._catchFn = null;
        this._finallyFn = null;
        if (this.error !== null && catchFn !== null){
            catchFn(this.error);
        }
        if (finallyFn !== null){
            finallyFn();
        }
    },

    _wrapCallback: function(fn){
        var expectation = this;
        return function(){
            if (expectation.error !== null){
                return;
            }
            if (expectation.timeoutTimer !== null){
                expectation.timeoutTimer.invalidate();
            }
            try{
                return fn.apply(this, arguments);
            }catch (e){
                expectation.error = e;
            }finally{
                expectation._finish();
            }
        };
    }

});
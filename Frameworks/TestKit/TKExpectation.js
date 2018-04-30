// #import "Foundation/Foundation.js"
/* global JSClass, JSObject, JSTimer */
'use strict';

JSClass("TKExpectation", JSObject, {

    error: null,
    timeoutTimer: null,
    isDone: false,
    _callCount: 0,
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
        ++this._callCount;
        return fn.apply(target, args);
    },

    /// Start a timer that can interrupt the async process early
    ///
    /// Typically called automatically by TKTestSuite.wait, a timeout ensures that
    /// the test won't get stuck forever, while also enforcing strict async timing requirements
    setTimeout: function(timeout){
        this.timeoutTimer = JSTimer.scheduledTimerWithInterval(timeout, function(){
            // If a timer call got scheduled before the timer was invalidated, but it runs after
            // a callback runs, ignore the timeout since we're already done.
            if (this.isDone){
                return;
            }
            this.error = new Error("Expectation took longer than %f seconds".sprintf(timeout));
            this.timeoutTimer = null;
            this._finish();
        }, this);
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
            --expectation._callCount;
            // If we have an error, it's because we already timed out and notified
            // the test runner, so we need to ingore any further callbacks
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
                if (expectation._callCount === 0){
                    expectation._finish();
                }
            }
        };
    }

});
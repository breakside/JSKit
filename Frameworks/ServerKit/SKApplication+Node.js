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

// #import "SKApplication.js"
// jshint node: true
'use strict';

var logger = JSLog("serverkit", "application");

SKApplication.definePropertiesFromExtensions({

    rawProcessArguments: function(){
        return process.argv.slice(1);
    },

    _getWorkingDirectoryURL: function(){
        return JSFileManager.shared.urlForPath(process.cwd(), null, true);
    },

    _signal: function(signal){
        switch (signal){
            case SKApplication.Signal.terminate:
            case SKApplication.Signal.interrupt:
            case SKApplication.Signal.hangup:
                this.stop(signal, function(){
                    process.exit(0);
                });
                break;
        }
    },

    _crash: function(error){
        var app = this;
        var stop = function(){
            app.stop(0, function(){
                logger.info("exit(1)");
                process.exit(1);
            });
        };
        if (this.delegate && this.delegate.applicationDidCrash){
            try{
                var logs = JSLog.getRecords();
                var promise = this.delegate.applicationDidCrash(this, error, logs);
                if (promise instanceof Promise){
                    promise.catch(function(error){
                        logger.error("Error while handling crash: %{error}", error);
                    }).finally(stop);
                }else{
                    stop();
                }
            }catch (e){
                logger.error("Error while handling crash: %{error}", e);
                stop();
            }
        }else{
            logger.error(error);
            stop();
        }
    }

});

JSGlobalObject.SKApplicationMain = function SKApplicationMain(){
    var application = SKApplication.init();
    var listeners = {
        SIGTERM: function(){
            removeListeners();
            application._signal(SKApplication.Signal.terminate);
        },
        SIGINT: function(){
            removeListeners();
            application._signal(SKApplication.Signal.interrupt);
        },
        SIGHUP: function(){
            removeListeners();
            application._signal(SKApplication.Signal.hangup);
        },
        uncaughtException: function(error){
            removeListeners();
            logger.log("uncaught exception");
            application._crash(error);
        },
        unhandledRejection: function(error){
            removeListeners();
            logger.log("unhandled promise rejection");
            if (error instanceof Error){
                application._crash(error);
            }else{
                application._crash(new Error("unhandled promise rejection with non-error result"));
            }
        }
    };
    var addListeners = function(){
        for (var name in listeners){
            process.on(name, listeners[name]);
        }
    };
    var removeListeners = function(){
        for (var name in listeners){
            process.off(name, listeners[name]);
        }
    };
    addListeners();
    application.run(function(error){
        if (error !== null){
            logger.error(error);
            return;
        }
    });
};
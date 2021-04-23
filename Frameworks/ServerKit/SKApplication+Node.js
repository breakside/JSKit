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
                this.stop(signal);
                break;
        }
    },

    _crash: function(error){
        logger.error(error);
        var exit = function(){
            logger.info("exit(1)");
            process.exit(1);
        };
        if (this.delegate && this.delegate.applicationDidCrash){
            var logs = JSLog.getRecords();
            try{
                var promise = this.delegate.applicationDidCrash(this, error, logs);
                if (promise instanceof Promise){
                    promise.catch(function(error){
                        logger.error("Error while handling crash: %{error}", error);
                    }).finally(exit);
                }else{
                    exit();
                }
            }catch (e){
                logger.error("Error while handling crash: %{error}", e);
                exit();
            }
        }
    }

});

JSGlobalObject.SKApplicationMain = function SKApplicationMain(){
    var application = SKApplication.init();
    process.on("SIGTERM", function(){
        application._signal(SKApplication.Signal.terminate);
    });
    process.on("SIGINT", function(){
        application._signal(SKApplication.Signal.interrupt);
    });
    process.on("SIGHUP", function(){
        application._signal(SKApplication.Signal.hangup);
    });
    process.on("uncaughtException", function(error){
        logger.log("uncaught exception");
        application._crash(error);
    });
    process.on("unhandledRejection", function(error){
        logger.log("unhandled promise rejection");
        if (error instanceof Error){
            application._crash(error);
        }else{
            application._crash(new Error("unhandled promise rejection with non-error result"));
        }
    });
    application.run(function(error){
        if (error !== null){
            logger.error(error);
            return;
        }
    });
};
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

// #import Foundation
// #import "SKSecrets.js"
// #import "SKSecretsEnvironmentProvider.js"
'use strict';

(function(){

var logger = JSLog("serverkit", "application");

var shared = null;

JSClass('SKApplication', JSObject, {

    launchOptions: null,
    bundle: null,
    workingDirectoryURL: null,
    secrets: null,
    environment: null,

    init: function(){
        if (shared){
            throw new Error("SKApplication.init: one application already initialized, and only one may exist");
        }
        shared = this;
        this.bundle = JSBundle.mainBundle;
        this.workingDirectoryURL = this._getWorkingDirectoryURL();
        this.environment = JSEnvironment.current;
    },

    deinit: function(){
        shared = null;
    },

    run: function(completion, target){
        this.parseLaunchOptions();
        JSFileManager.shared.open(function(state){
            if (state != JSFileManager.State.success){
                completion.call(target, new Error("Failed to open filesystem"));
                return;
            }
            this.populateSecrets(JSFileManager.shared, function(){
                try{
                    this._launch();
                    completion.call(target, null);
                }catch (e){
                    completion.call(target, e);
                }
            }, this);
        }, this);
    },

    parseLaunchOptions: function(){
        var optionDefinitions = JSCopy(this.bundle.info[SKApplication.InfoKeys.LaunchOptions]);
        optionDefinitions.SKDebugEnv = {
            default: null
        };
        var rawArguments = this.rawProcessArguments();
        this.launchOptions = JSArguments.initWithOptions(optionDefinitions);
        this.launchOptions.parse(rawArguments);
    },

    setup: function(){
        this.setupFonts();
        this.setupDelegate();
    },

    populateSecrets: function(fileManager, completion, target){
        this.secrets = SKSecrets.initWithNames(this.bundle.info.SKApplicationSecrets || []);
        var debugEnvPath = this.launchOptions.SKDebugEnv;
        if (debugEnvPath !== null){
            var envURL = fileManager.urlForPath(debugEnvPath, this.workingDirectoryURL);
            fileManager.contentsAtURL(envURL, function(data){
                if (data !== null){
                    this.environment = JSEnvironment.initWithData(data);
                }else{
                    logger.warn("env file not found: %{public}".sprintf(debugEnvPath));
                    this.environment = JSEnvironment.init();
                }
                this.secrets.addProvider(SKSecretsEnvironmentProvider.initWithEnvironment(this.environment));
                completion.call(target);
            }, this);
        }else{
            this.secrets.addProvider(SKSecretsEnvironmentProvider.initWithEnvironment(this.environment));
            completion.call(target);
        }
    },

    _launch: function(){
        this.setup();
        if (!this.delegate){
            throw new Error("No application delegate defined");
        }
        if (!this.delegate.applicationDidFinishLaunching){
            throw new Error("ApplicationDelegate does not implement applicationDidFinishLaunching()");
        }
        logger.info("Calling delegate.applicationDidFinishLaunching");
        this.delegate.applicationDidFinishLaunching(this, this.launchOptions);
    },

    setupFonts: function(){
        JSFont.registerBundleFonts(this.bundle);
    },

    setupDelegate: function(){
        if (this.bundle.info[SKApplication.InfoKeys.MainSpec]){
            var mainUIFile = JSSpec.initWithResource(this.bundle.info[SKApplication.InfoKeys.MainSpec]);
            this.delegate = mainUIFile.filesOwner;
        }else if (this.bundle.info[SKApplication.InfoKeys.ApplicationDelegate]){
            var delegateClass = JSClass.FromName(this.bundle.info[SKApplication.InfoKeys.ApplicationDelegate]);
            this.delegate = delegateClass.init();
        }else{
            throw new Error("SKApplication: Info is missing required key '%s' or '%s'".sprintf(SKApplication.InfoKeys.MainSpec, SKApplication.InfoKeys.ApplicationDelegate));
        }
    },

    rawProcessArguments: function(){
        return [];
    },

    _getWorkingDirectoryURL: function(){
        return null;
    },

    _isStopping: false,

    stop: function(signal, completion, target){
        if (this._isStopping){
            return;
        }
        this._isStopping = true;
        this._gracefulShutdown(signal, function(){
            completion.call(target);
        });
    },

    _gracefulShutdown: function(signal, completion){
        var app = this;
        var shutdown = function(){
            app.shutdown(completion);
        };
        if (this.delegate && this.delegate.applicationWillTerminate){
            try{
                var promise = this.delegate.applicationWillTerminate(this, signal, shutdown);
                if (promise instanceof Promise){
                    promise.catch(function(error){
                        logger.error("Error calling applicationWillTerminate: %{error}", error);
                    }).finally(shutdown);
                }
            }catch (e){
                logger.error("Error calling applicationWillTerminate: %{error}", e);
                shutdown();
            }
        }else{
            shutdown();
        }
    },

    shutdown: function(completion){
        completion();
    }

});

SKApplication.InfoKeys = {
    MainSpec: "SKMainSpec",
    ApplicationDelegate: "SKApplicationDelegate",
    LaunchOptions: "SKApplicationLaunchOptions",
};

Object.defineProperty(SKApplication, 'shared', {
    configurable: true,
    get: function SKApplication_getSharedApplication(){
        return shared;
    }
});

SKApplication.Signal = {
    SIGHUP: 1,      // terminate process    terminal line hangup
    SIGINT: 2,      // terminate process    interrupt program
    SIGQUIT: 3,     // create core image    quit program
    SIGILL: 4,      // create core image    illegal instruction
    SIGTRAP: 5,     // create core image    trace trap
    SIGABRT: 6,     // create core image    abort program (formerly SIGIOT)
    SIGKILL: 9,     // terminate process    kill program
    SIGTERM: 15,    // terminate process    software termination signal
};

SKApplication.Signal.hangup = SKApplication.Signal.SIGHUP;
SKApplication.Signal.interrupt = SKApplication.Signal.SIGINT;
SKApplication.Signal.quit = SKApplication.Signal.SIGQUIT;
SKApplication.Signal.illegalInstruction = SKApplication.Signal.SIGILL;
SKApplication.Signal.trap = SKApplication.Signal.SIGTRAP;
SKApplication.Signal.abort = SKApplication.Signal.SIGABRT;
SKApplication.Signal.kill = SKApplication.Signal.SIGKILL;
SKApplication.Signal.terminate = SKApplication.Signal.SIGTERM;

})();

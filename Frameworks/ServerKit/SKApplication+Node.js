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
    application.run(function(error){
        if (error !== null){
            logger.error(error);
            return;
        }
    });
};
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

// #import "SKSecretsProvider.js"
'use strict';

(function(){

JSClass("SKSecretsEnvironmentProvider", SKSecretsProvider, {

    initWithEnvironment: function(environment){
        if (environment instanceof JSEnvironment){
            this.environment = environment.getAll();
        }else{
            this.environment = environment;
        }
    },

    secretForName: function(name){
        var secret = this.environment[name];
        if (secret !== undefined){
            return secret;
        }
        name = envname(name);
        return this.environment[name] || null;
    }

});

function envname(name){
    var transformed = '';
    var c;
    var C;
    var consecutiveUpperCount = 0;
    for (var i = 0, l = name.length; i < l; ++i){
        c = name[i];
        C = c.toUpperCase();
        if (c === C){
            if (consecutiveUpperCount === 0 && i > 0){
                transformed += "_";
            }
            ++consecutiveUpperCount;
        }else{
            if (consecutiveUpperCount > 1){
                transformed = transformed.substr(0, transformed.length - 1) + "_" + transformed.substr(transformed.length - 1);
            }
            consecutiveUpperCount = 0;
        }
        transformed += C;
    }
    return transformed;
}

})();
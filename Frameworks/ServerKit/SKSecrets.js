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
'use strict';

JSClass("SKSecrets", JSObject, {

    providers: null,
    
    initWithNames: function(names){
        this.providers = [];
        for (var i = 0, l = names.length; i < l; ++i){
            this._addPropertyForName(names[i]);
        }
    },

    _addPropertyForName: function(name){
        Object.defineProperty(this, name, {
            get: function SKSecrets_getSecret(){
                return this.valueForName(name);
            }
        });
    },

    valueForName: function(name){
        var provider;
        var secret;
        for (var i = this.providers.length - 1; i >= 0; --i){
            provider = this.providers[i];
            secret = provider.secretForName(name);
            if (secret !== null){
                return secret;
            }
        }
        return null;
    },

    stringForName: function(name){
        return this.valueForName(name);
    },

    integerForName: function(name){
        var stringValue = this.stringForName(name);
        if (stringValue !== null){
            var n = parseInt(stringValue);
            if (!isNaN(n)){
                return n;
            }
        }
        return null;
    },

    urlForName: function(name, baseURL){
        var urlString = this.stringForName(name);
        if (urlString !== null){
            return JSURL.initWithString(urlString, baseURL);
        }
        return null;
    },

    base64DataForName: function(name){
        var base64 = this.stringForName(name);
        if (base64 !== null){
            try{
                return base64.dataByDecodingBase64();
            }catch(e){
                return null;
            }
        }
        return null;
    },

    base64URLDataForName: function(name){
        var base64 = this.stringForName(name);
        if (base64 !== null){
            try{
                return base64.dataByDecodingBase64URL();
            }catch(e){
                return null;
            }
        }
        return null;
    },

    hexDataForName: function(name){
        var hex = this.stringForName(name);
        if (hex !== null){
            try{
                return hex.dataByDecodingHex();
            }catch (e){
            }
        }
        return null;
    },

    addProvider: function(provider){
        this.providers.push(provider);
    },

});
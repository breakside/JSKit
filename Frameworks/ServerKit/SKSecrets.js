// #import Foundation
// #import "SKSecretsEnvironmentProvider.js"
'use strict';

JSClass("SKSecrets", JSObject, {

    providers: null,
    
    initWithNames: function(names){
        this.providers = [SKSecretsEnvironmentProvider.initWithEnvironment(SKSecrets.environment)];
        for (var i = 0, l = names.length; i < l; ++i){
            this._addPropertyForName(names[i]);
        }
    },

    _addPropertyForName: function(name){
        Object.defineProperty(this, name, {
            get: function SKSecrets_getSecret(){
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
            }
        });
    },

    addProvider: function(provider){
        this.providers.push(provider);
    },

});
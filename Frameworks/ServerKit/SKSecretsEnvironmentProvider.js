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
    for (var i = 0, l = name.length; i < l; ++i){
        c = name[i];
        C = c.toUpperCase();
        if (c === C){
            transformed += '_';
        }
        transformed += C;
    }
    return transformed;
}

})();
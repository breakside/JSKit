// #import Foundation
// #import "SECJSONWebToken.js"
// #import "SECHTMLKey.js"
// jshint browser: true
/* global crypto */
'use strict';

(function(){

SECJSONWebToken.definePropertiesFromExtensions({

    createVerifyKey: function(jwk, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var algorithm = htmlAlgorithms[jwk.alg];
        crypto.subtle.importKey("jwk", jwk, algorithm, true, ["verify"]).then(function(htmlKey){
            var key = SECHTMLKey.initWithKey(htmlKey);
            completion.call(target, key);
        }, function(error){
            completion.call(target, null);
        });
        return completion.promise;
    }

});

var htmlAlgorithms = {};
htmlAlgorithms["RS256"] = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256'};
htmlAlgorithms["RS384"] = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-384'};
htmlAlgorithms["RS512"] = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-512'};


})();
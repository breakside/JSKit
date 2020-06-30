// #import ServerKit
// #import TestKit
'use strict';

JSClass("SKSecretsTests", TKTestSuite, {

    testProperty: function(){
        var env = {
            firstTest: "Hello",
            FIRST_TEST: "There",
            SECOND_TEST: "World!"
        };
        var secrets = SKSecrets.initWithNames([
            'firstTest',
            'secondTest',
            'other',
        ]);
        secrets.providers[0] = SKSecretsEnvironmentProvider.initWithEnvironment(env);
        var secret = secrets.firstTest;
        TKAssertEquals(secret, "Hello");

        secret = secrets.FIRST_TEST;
        TKAssertUndefined(secret);

        secret = secrets.secondTest;
        TKAssertEquals(secret, "World!");

        secret = secrets.SECOND_TEST;
        TKAssertUndefined(secret);

        secret = secrets.notThere;
        TKAssertUndefined(secret);

        secret = secrets.other;
        TKAssertNull(secret);
    },

    testMultipleProviders: function(){
        var env = {
            FIRST_TEST: "Hello",
            SECOND_TEST: "World!"
        };
        var secrets = SKSecrets.initWithNames([
            'firstTest',
            'secondTest',
            'other',
        ]);
        secrets.providers[0] = SKSecretsEnvironmentProvider.initWithEnvironment(env);
        var providerClass = SKSecretsProvider.$extend({

            secretForName: function(name){
                if (name === "secondTest"){
                    return "New";
                }
                if (name === "other"){
                    return "Here";
                }
                return null;
            }
        }, "TestProvider");
        secrets.addProvider(providerClass.init());

        var secret = secrets.firstTest;
        TKAssertEquals(secret, "Hello");

        secret = secrets.FIRST_TEST;
        TKAssertUndefined(secret);

        secret = secrets.secondTest;
        TKAssertEquals(secret, "New");

        secret = secrets.SECOND_TEST;
        TKAssertUndefined(secret);

        secret = secrets.notThere;
        TKAssertUndefined(secret);

        secret = secrets.other;
        TKAssertEquals(secret, "Here");
    }

});
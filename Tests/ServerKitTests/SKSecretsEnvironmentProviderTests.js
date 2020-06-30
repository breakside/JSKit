// #import ServerKit
// #import TestKit
'use strict';

JSClass("SKSecretsEnvironmentProviderTests", TKTestSuite, {

    testSecretForName: function(){
        var env = {
            firstTest: "Hello",
            FIRST_TEST: "There",
            SECOND_TEST: "World!"
        };
        var provider = SKSecretsEnvironmentProvider.initWithEnvironment(env);
        var secret = provider.secretForName("firstTest");
        TKAssertEquals(secret, "Hello");

        secret = provider.secretForName("FIRST_TEST");
        TKAssertEquals(secret, "There");

        secret = provider.secretForName("secondTest");
        TKAssertEquals(secret, "World!");

        secret = provider.secretForName("SECOND_TEST");
        TKAssertEquals(secret, "World!");

        secret = provider.secretForName("notThere");
        TKAssertNull(secret);
    }

});
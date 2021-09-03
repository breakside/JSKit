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
        secrets.addProvider(SKSecretsEnvironmentProvider.initWithEnvironment(env));
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
        secrets.addProvider(SKSecretsEnvironmentProvider.initWithEnvironment(env));
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
    },

    testValueForName: function(){
        var env = {
            firstTest: "Hello",
            FIRST_TEST: "There",
            SECOND_TEST: "World!"
        };
        var secrets = SKSecrets.initWithNames([
            'firstTest'
        ]);
        secrets.addProvider(SKSecretsEnvironmentProvider.initWithEnvironment(env));
        var secret = secrets.valueForName("firstTest");
        TKAssertEquals(secret, "Hello");

        secret = secrets.valueForName("secondTest");
        TKAssertEquals(secret, "World!");

        secret = secrets.valueForName("missing");
        TKAssertNull(secret);
    },

    testStringForName: function(){
        var env = {
            TEST_VAR: "Hello"
        };
        var secrets = SKSecrets.initWithNames([]);
        secrets.addProvider(SKSecretsEnvironmentProvider.initWithEnvironment(env));
        var secret = secrets.stringForName("testVar");
        TKAssertEquals(secret, "Hello");

        secret = secrets.stringForName("missing");
        TKAssertNull(secret);
    },

    testIntegerForName: function(){
        var env = {
            TEST_VAR: "123",
            OTHER_VAR: "notanint"
        };
        var secrets = SKSecrets.initWithNames([]);
        secrets.addProvider(SKSecretsEnvironmentProvider.initWithEnvironment(env));
        var secret = secrets.integerForName("testVar");
        TKAssertExactEquals(secret, 123);

        secret = secrets.integerForName("otherVar");
        TKAssertNull(secret);

        secret = secrets.integerForName("missing");
        TKAssertNull(secret);
    },

    testURLForName: function(){
        var env = {
            TEST_VAR: "https://test.breakside.io",
            RELATIVE_VAR: "data/test",
            OTHER_VAR: "😁"
        };
        var secrets = SKSecrets.initWithNames([]);
        secrets.addProvider(SKSecretsEnvironmentProvider.initWithEnvironment(env));

        var secret = secrets.urlForName("testVar");
        TKAssertEquals(secret.encodedString, "https://test.breakside.io");

        secret = secrets.urlForName("testVar", JSURL.initWithString("file:///one/two/"));
        TKAssertEquals(secret.encodedString, "https://test.breakside.io");

        secret = secrets.urlForName("relativeVar", JSURL.initWithString("file:///one/two/"));
        TKAssertEquals(secret.encodedString, "file:///one/two/data/test");

        secret = secrets.urlForName("otherVar");
        TKAssertNull(secret);

        secret = secrets.urlForName("missing");
        TKAssertNull(secret);
    },

    testBase64DataForName: function(){
        var env = {
            TEST_VAR: "hello".utf8().base64StringRepresentation(),
            OTHER_VAR: "@notbase64"
        };
        var secrets = SKSecrets.initWithNames([]);
        secrets.addProvider(SKSecretsEnvironmentProvider.initWithEnvironment(env));

        var secret = secrets.base64DataForName("testVar");
        TKAssertEquals(secret.stringByDecodingUTF8(), "hello");

        secret = secrets.base64DataForName("otherVar");
        TKAssertNull(secret);

        secret = secrets.base64DataForName("missing");
        TKAssertNull(secret);
    },

    testBase64URLDataForName: function(){
        var env = {
            TEST_VAR: "hello".utf8().base64URLStringRepresentation(),
            OTHER_VAR: "@notbase64"
        };
        var secrets = SKSecrets.initWithNames([]);
        secrets.addProvider(SKSecretsEnvironmentProvider.initWithEnvironment(env));

        var secret = secrets.base64URLDataForName("testVar");
        TKAssertEquals(secret.stringByDecodingUTF8(), "hello");

        secret = secrets.base64URLDataForName("otherVar");
        TKAssertNull(secret);

        secret = secrets.base64URLDataForName("missing");
        TKAssertNull(secret);
    },

    testHexDataForName: function(){
        var env = {
            TEST_VAR: "hello".utf8().hexStringRepresentation(),
            OTHER_VAR: "nothex"
        };
        var secrets = SKSecrets.initWithNames([]);
        secrets.addProvider(SKSecretsEnvironmentProvider.initWithEnvironment(env));

        var secret = secrets.hexDataForName("testVar");
        TKAssertEquals(secret.stringByDecodingUTF8(), "hello");

        secret = secrets.hexDataForName("otherVar");
        TKAssertNull(secret);

        secret = secrets.hexDataForName("missing");
        TKAssertNull(secret);
    }

});
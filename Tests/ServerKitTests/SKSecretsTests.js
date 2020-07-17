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
    }

});
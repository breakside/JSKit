// #import "ServerKit/ServerKit.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, SKApplication */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertThrows */
'use strict';

JSClass("SKApplicationTests", TKTestSuite, {

    testParseLaunchOptions: function(){
        // Basics tests:
        var optionDefintions = {
            test: {kind: "integer"},
            flag: {kind: "flag"}
        };
        var rawArguments = ['exe', '--test', '1', '--flag'];
        var options = SKApplication.ParseLaunchOptions(optionDefintions, rawArguments);
        TKAssertExactEquals(options.test, 1);
        TKAssert(options.flag);

        // flag missing
        rawArguments = ['exe', '--test', '1'];
        options = SKApplication.ParseLaunchOptions(optionDefintions, rawArguments);
        TKAssertExactEquals(options.test, 1);
        TKAssert(!options.flag);

        // missing value from non-flag field
        rawArguments = ['exe', '--test', '--flag'];
        TKAssertThrows(function(){
            SKApplication.ParseLaunchOptions(optionDefintions, rawArguments);
        });

        // missing required non-flag field
        optionDefintions = {
            test: {kind: "integer", required: true},
            flag: {kind: "flag", required: true}
        };
        rawArguments = ['exe', '--flag'];
        TKAssertThrows(function(){
            SKApplication.ParseLaunchOptions(optionDefintions, rawArguments);
        });

        // missing required flag field (non-sensical, but possible configuration)
        rawArguments = ['exe', '--test', '1'];
        SKApplication.ParseLaunchOptions(optionDefintions, rawArguments);
        TKAssertExactEquals(options.test, 1);
        TKAssert(!options.flag);
    }

});
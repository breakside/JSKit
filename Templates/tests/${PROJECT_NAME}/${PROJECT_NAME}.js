// #import TestKit
/* global JSClass, TKTestSuite, TKAssert, TKAssertNotNull, TKAssertEquals, TKAssertObjectEquals, JSPoint */
'use strict';

JSClass('${PROJECT_NAME}', TKTestSuite, {

    testExample: function(){
        var x = 1;
        var y = 2;
        TKAssertEquals(x, 1);
        TKAssertEquals(y, 2);
    }

});
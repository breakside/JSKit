// #import ${PROJECT_NAME}
// #import TestKit
'use strict';

JSClass('${PROJECT_NAME}Tests', TKTestSuite, {

    testExample: function(){
        var x = 1;
        var y = 2;
        TKAssertEquals(x, 1);
        TKAssertEquals(y, 2);
    }

});
// #import Foundation
// #import TestKit
/* global JSClass, JSGradient, JSColor, TKTestSuite, JSBundle */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
'use strict';

JSClass('JSGradientTests', TKTestSuite, {

    testRotated: function(){
        var gradient = JSGradient.init();
        gradient.addStop(0, JSColor.black);
        gradient.addStop(1, JSColor.white);
        TKAssertFloatEquals(gradient.start.x, 0);
        TKAssertFloatEquals(gradient.start.y, 0);
        TKAssertFloatEquals(gradient.end.x, 0);
        TKAssertFloatEquals(gradient.end.y, 1);

        var rotated = gradient.rotated(Math.PI);
        TKAssertFloatEquals(rotated.start.x, 1);
        TKAssertFloatEquals(rotated.start.y, 1);
        TKAssertFloatEquals(rotated.end.x, 1);
        TKAssertFloatEquals(rotated.end.y, 0);

        rotated = gradient.rotated(Math.PI / 2);
        TKAssertFloatEquals(rotated.start.x, 1);
        TKAssertFloatEquals(rotated.start.y, 0);
        TKAssertFloatEquals(rotated.end.x, 0);
        TKAssertFloatEquals(rotated.end.y, 0);

        rotated = gradient.rotated(-Math.PI / 2);
        TKAssertFloatEquals(rotated.start.x, 0);
        TKAssertFloatEquals(rotated.start.y, 1);
        TKAssertFloatEquals(rotated.end.x, 1);
        TKAssertFloatEquals(rotated.end.y, 1);
    }

});
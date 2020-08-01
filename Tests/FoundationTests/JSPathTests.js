// #imoprt Foundation
// #import TestKit
'use strict';

JSClass("JSPathTests", TKTestSuite, {

    testInit: function(){
        var path = JSPath.init();
        TKAssertEquals(path.subpaths.length, 0);
        TKAssertNotNull(path.currentPoint);
        TKAssertFloatEquals(path.currentPoint.x, 0);
        TKAssertFloatEquals(path.currentPoint.y, 0);
        TKAssert(path.empty);
    },

    testMoveToPoint: function(){
        var path = JSPath.init();
        path.moveToPoint(JSPoint(1, 2));
        TKAssert(path.empty);
        TKAssertFloatEquals(path.currentPoint.x, 1);
        TKAssertFloatEquals(path.currentPoint.y, 2);
        TKAssertEquals(path.subpaths.length, 1);
        TKAssertFloatEquals(path.subpaths[0].firstPoint.x, 1);
        TKAssertFloatEquals(path.subpaths[0].firstPoint.y, 2);
        TKAssertEquals(path.subpaths[0].segments.length, 0);

        // second move
        path.moveToPoint(JSPoint(3, -7));
        TKAssert(path.empty);
        TKAssert(!path.subpaths[0].closed);
        TKAssertFloatEquals(path.currentPoint.x, 3);
        TKAssertFloatEquals(path.currentPoint.y, -7);
        TKAssertEquals(path.subpaths.length, 2);
        TKAssertFloatEquals(path.subpaths[1].firstPoint.x, 3);
        TKAssertFloatEquals(path.subpaths[1].firstPoint.y, -7);
        TKAssertEquals(path.subpaths[1].segments.length, 0);

        // transform
        path = JSPath.init();
        var transform = JSAffineTransform.Scaled(2, 3);
        path.moveToPoint(JSPoint(5, 7), transform);
        TKAssert(path.empty);
        TKAssertFloatEquals(path.currentPoint.x, 10);
        TKAssertFloatEquals(path.currentPoint.y, 21);
        TKAssertEquals(path.subpaths.length, 1);
        TKAssertFloatEquals(path.subpaths[0].firstPoint.x, 10);
        TKAssertFloatEquals(path.subpaths[0].firstPoint.y, 21);
        TKAssertEquals(path.subpaths[0].segments.length, 0);
    },

    testAddLineToPoint: function(){
        var path = JSPath.init();
        path.moveToPoint(JSPoint(1, 2));
        TKAssert(path.empty);
        TKAssertFloatEquals(path.currentPoint.x, 1);
        TKAssertFloatEquals(path.currentPoint.y, 2);
        TKAssertEquals(path.subpaths.length, 1);
        TKAssertFloatEquals(path.subpaths[0].firstPoint.x, 1);
        TKAssertFloatEquals(path.subpaths[0].firstPoint.y, 2);
        TKAssertEquals(path.subpaths[0].segments.length, 0);

        // line after move
        path.addLineToPoint(JSPoint(3, -7));
        TKAssert(!path.empty);
        TKAssert(!path.subpaths[0].closed);
        TKAssertFloatEquals(path.currentPoint.x, 3);
        TKAssertFloatEquals(path.currentPoint.y, -7);
        TKAssertEquals(path.subpaths.length, 1);
        TKAssertEquals(path.subpaths[0].segments.length, 1);
        TKAssertFloatEquals(path.subpaths[0].segments[0].end.x, 3);
        TKAssertFloatEquals(path.subpaths[0].segments[0].end.y, -7);

        // line without first move
        path = JSPath.init();
        path.addLineToPoint(JSPoint(3, -7));
        TKAssert(!path.empty);
        TKAssert(!path.subpaths[0].closed);
        TKAssertFloatEquals(path.currentPoint.x, 3);
        TKAssertFloatEquals(path.currentPoint.y, -7);
        TKAssertEquals(path.subpaths.length, 1);
        TKAssertFloatEquals(path.subpaths[0].firstPoint.x, 0);
        TKAssertFloatEquals(path.subpaths[0].firstPoint.y, 0);
        TKAssertEquals(path.subpaths[0].segments.length, 1);
        TKAssertFloatEquals(path.subpaths[0].segments[0].end.x, 3);
        TKAssertFloatEquals(path.subpaths[0].segments[0].end.y, -7);

        // transform
        path = JSPath.init();
        var transform = JSAffineTransform.Scaled(2, 3);
        path.moveToPoint(JSPoint(5, 7), transform);
        TKAssert(path.empty);
        TKAssertFloatEquals(path.currentPoint.x, 10);
        TKAssertFloatEquals(path.currentPoint.y, 21);
        TKAssertEquals(path.subpaths.length, 1);
        TKAssertFloatEquals(path.subpaths[0].firstPoint.x, 10);
        TKAssertFloatEquals(path.subpaths[0].firstPoint.y, 21);
        TKAssertEquals(path.subpaths[0].segments.length, 0);

        // additional line (tranform)
        path.addLineToPoint(JSPoint(6, -1), transform);
        TKAssert(!path.empty);
        TKAssertEquals(path.subpaths.length, 1);
        TKAssert(!path.subpaths[0].closed);
        TKAssertFloatEquals(path.currentPoint.x, 12);
        TKAssertFloatEquals(path.currentPoint.y, -3);
        TKAssertEquals(path.subpaths[0].segments.length, 1);
        TKAssertFloatEquals(path.subpaths[0].segments[0].end.x, 12);
        TKAssertFloatEquals(path.subpaths[0].segments[0].end.y, -3);
    },

    testAddCurveToPoint: function(){
        var path = JSPath.init();
        path.moveToPoint(JSPoint(3, 4));
        TKAssert(path.empty);
        TKAssertFloatEquals(path.currentPoint.x, 3);
        TKAssertFloatEquals(path.currentPoint.y, 4);
        TKAssertEquals(path.subpaths.length, 1);
        TKAssertFloatEquals(path.subpaths[0].firstPoint.x, 3);
        TKAssertFloatEquals(path.subpaths[0].firstPoint.y, 4);
        TKAssertEquals(path.subpaths[0].segments.length, 0);

        // curve after move
        path.addCurveToPoint(JSPoint(3, 5), JSPoint(3.2, 4.2), JSPoint(2.8, 4.8));
        TKAssert(!path.empty);
        TKAssert(!path.subpaths[0].closed);
        TKAssertFloatEquals(path.currentPoint.x, 3);
        TKAssertFloatEquals(path.currentPoint.y, 5);
        TKAssertEquals(path.subpaths.length, 1);
        TKAssertEquals(path.subpaths[0].segments.length, 1);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.p1.x, 3);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.p1.y, 4);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.cp1.x, 3.2);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.cp1.y, 4.2);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.cp2.x, 2.8);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.cp2.y, 4.8);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.p2.x, 3);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.p2.y, 5);

        // curve without first move
        path = JSPath.init();
        path.addCurveToPoint(JSPoint(3, 5), JSPoint(3.2, 4.2), JSPoint(2.8, 4.8));
        TKAssert(!path.empty);
        TKAssertEquals(path.subpaths.length, 1);
        TKAssert(!path.subpaths[0].closed);
        TKAssertFloatEquals(path.subpaths[0].firstPoint.x, 0);
        TKAssertFloatEquals(path.subpaths[0].firstPoint.y, 0);
        TKAssertFloatEquals(path.currentPoint.x, 3);
        TKAssertFloatEquals(path.currentPoint.y, 5);
        TKAssertEquals(path.subpaths[0].segments.length, 1);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.p1.x, 0);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.p1.y, 0);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.cp1.x, 3.2);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.cp1.y, 4.2);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.cp2.x, 2.8);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.cp2.y, 4.8);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.p2.x, 3);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.p2.y, 5);

        // transform
        var transform = JSAffineTransform.Scaled(2, 3);
        path = JSPath.init();
        path.moveToPoint(JSPoint(3, 4), transform);
        TKAssert(path.empty);
        TKAssertFloatEquals(path.currentPoint.x, 6);
        TKAssertFloatEquals(path.currentPoint.y, 12);
        TKAssertEquals(path.subpaths.length, 1);
        TKAssertFloatEquals(path.subpaths[0].firstPoint.x, 6);
        TKAssertFloatEquals(path.subpaths[0].firstPoint.y, 12);
        TKAssertEquals(path.subpaths[0].segments.length, 0);

        // additional curve (transform)
        path.addCurveToPoint(JSPoint(9, 10), JSPoint(5, 6), JSPoint(7, 8), transform);
        TKAssert(!path.empty);
        TKAssert(!path.subpaths[0].closed);
        TKAssertFloatEquals(path.currentPoint.x, 18);
        TKAssertFloatEquals(path.currentPoint.y, 30);
        TKAssertEquals(path.subpaths.length, 1);
        TKAssertEquals(path.subpaths[0].segments.length, 1);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.p1.x, 6);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.p1.y, 12);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.cp1.x, 10);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.cp1.y, 18);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.cp2.x, 14);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.cp2.y, 24);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.p2.x, 18);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.p2.y, 30);
    },

    testCloseSubpath: function(){
        var path = JSPath.init();
        path.moveToPoint(JSPoint(1, 2));
        TKAssert(path.empty);
        TKAssertFloatEquals(path.currentPoint.x, 1);
        TKAssertFloatEquals(path.currentPoint.y, 2);
        TKAssertEquals(path.subpaths.length, 1);
        TKAssertFloatEquals(path.subpaths[0].firstPoint.x, 1);
        TKAssertFloatEquals(path.subpaths[0].firstPoint.y, 2);
        TKAssertEquals(path.subpaths[0].segments.length, 0);

        // close after move
        path.closeSubpath();
        TKAssert(!path.empty);
        TKAssertFloatEquals(path.currentPoint.x, 1);
        TKAssertFloatEquals(path.currentPoint.y, 2);
        TKAssertEquals(path.subpaths.length, 1);
        TKAssertFloatEquals(path.subpaths[0].firstPoint.x, 1);
        TKAssertFloatEquals(path.subpaths[0].firstPoint.y, 2);
        TKAssertEquals(path.subpaths[0].segments.length, 0);
        TKAssert(path.subpaths[0].closed);

        // close without move
        path = JSPath.init();
        path.closeSubpath();
        TKAssert(path.empty);
        TKAssertFloatEquals(path.currentPoint.x, 0);
        TKAssertFloatEquals(path.currentPoint.y, 0);
        TKAssertEquals(path.subpaths.length, 0);

        // close after line
        path = JSPath.init();
        path.moveToPoint(JSPoint(1, 2));
        path.addLineToPoint(JSPoint(3, 4));
        path.closeSubpath();
        TKAssert(!path.empty);
        TKAssertFloatEquals(path.currentPoint.x, 1);
        TKAssertFloatEquals(path.currentPoint.y, 2);
        TKAssertEquals(path.subpaths.length, 1);
        TKAssertFloatEquals(path.subpaths[0].firstPoint.x, 1);
        TKAssertFloatEquals(path.subpaths[0].firstPoint.y, 2);
        TKAssertEquals(path.subpaths[0].segments.length, 1);
        TKAssert(path.subpaths[0].closed);

        // move and line after close
        path = JSPath.init();
        path.moveToPoint(JSPoint(1, 2));
        path.addLineToPoint(JSPoint(3, 4));
        path.closeSubpath();
        path.moveToPoint(JSPoint(5, 6));
        TKAssert(!path.empty);
        TKAssertFloatEquals(path.currentPoint.x, 5);
        TKAssertFloatEquals(path.currentPoint.y, 6);
        TKAssertEquals(path.subpaths.length, 2);
        TKAssertFloatEquals(path.subpaths[0].firstPoint.x, 1);
        TKAssertFloatEquals(path.subpaths[0].firstPoint.y, 2);
        TKAssertEquals(path.subpaths[0].segments.length, 1);
        TKAssertFloatEquals(path.subpaths[1].firstPoint.x, 5);
        TKAssertFloatEquals(path.subpaths[1].firstPoint.y, 6);
        TKAssertEquals(path.subpaths[1].segments.length, 0);
        path.addLineToPoint(JSPoint(7, 8));
        path.closeSubpath();
        TKAssertFloatEquals(path.currentPoint.x, 5);
        TKAssertFloatEquals(path.currentPoint.y, 6);
        TKAssertEquals(path.subpaths.length, 2);
        TKAssertFloatEquals(path.subpaths[1].firstPoint.x, 5);
        TKAssertFloatEquals(path.subpaths[1].firstPoint.y, 6);
        TKAssertEquals(path.subpaths[1].segments.length, 1);
        TKAssertFloatEquals(path.subpaths[1].segments[0].end.x, 7);
        TKAssertFloatEquals(path.subpaths[1].segments[0].end.y, 8);
        TKAssert(path.subpaths[1].closed);
    },

    testAddRect: function(){
        var path = JSPath.init();
        path.addRect(JSRect(0, 1, 2, 3));
        TKAssert(!path.empty);
        TKAssertEquals(path.subpaths.length, 1);
        TKAssertFloatEquals(path.currentPoint.x, 0);
        TKAssertFloatEquals(path.currentPoint.y, 1);
        TKAssertFloatEquals(path.subpaths[0].firstPoint.x, 0);
        TKAssertFloatEquals(path.subpaths[0].firstPoint.y, 1);
        TKAssertEquals(path.subpaths[0].segments.length, 3);
        TKAssertFloatEquals(path.subpaths[0].segments[0].end.x, 2);
        TKAssertFloatEquals(path.subpaths[0].segments[0].end.y, 1);
        TKAssertFloatEquals(path.subpaths[0].segments[1].end.x, 2);
        TKAssertFloatEquals(path.subpaths[0].segments[1].end.y, 4);
        TKAssertFloatEquals(path.subpaths[0].segments[2].end.x, 0);
        TKAssertFloatEquals(path.subpaths[0].segments[2].end.y, 4);
        TKAssert(path.subpaths[0].closed);
        TKAssertFloatEquals(path.currentPoint.x, 0);
        TKAssertFloatEquals(path.currentPoint.y, 1);

        // add rect afte move
        path = JSPath.init();
        path.moveToPoint(JSPoint(2, 2));
        path.addRect(JSRect(0, 1, 2, 3));
        TKAssert(!path.empty);
        TKAssertEquals(path.subpaths.length, 2);
        TKAssert(!path.subpaths[0].closed);
        TKAssertFloatEquals(path.currentPoint.x, 0);
        TKAssertFloatEquals(path.currentPoint.y, 1);
        TKAssertFloatEquals(path.subpaths[1].firstPoint.x, 0);
        TKAssertFloatEquals(path.subpaths[1].firstPoint.y, 1);
        TKAssertEquals(path.subpaths[1].segments.length, 3);
        TKAssertFloatEquals(path.subpaths[1].segments[0].end.x, 2);
        TKAssertFloatEquals(path.subpaths[1].segments[0].end.y, 1);
        TKAssertFloatEquals(path.subpaths[1].segments[1].end.x, 2);
        TKAssertFloatEquals(path.subpaths[1].segments[1].end.y, 4);
        TKAssertFloatEquals(path.subpaths[1].segments[2].end.x, 0);
        TKAssertFloatEquals(path.subpaths[1].segments[2].end.y, 4);
        TKAssert(path.subpaths[1].closed);
        TKAssertFloatEquals(path.currentPoint.x, 0);
        TKAssertFloatEquals(path.currentPoint.y, 1);

        // transform
        var transform = JSAffineTransform.Scaled(2, 3);
        path = JSPath.init();
        path.addRect(JSRect(1, 2, 3, 4), transform);
        TKAssert(!path.empty);
        TKAssertEquals(path.subpaths.length, 1);
        TKAssertFloatEquals(path.currentPoint.x, 2);
        TKAssertFloatEquals(path.currentPoint.y, 6);
        TKAssertFloatEquals(path.subpaths[0].firstPoint.x, 2);
        TKAssertFloatEquals(path.subpaths[0].firstPoint.y, 6);
        TKAssertEquals(path.subpaths[0].segments.length, 3);
        TKAssertFloatEquals(path.subpaths[0].segments[0].end.x, 8);
        TKAssertFloatEquals(path.subpaths[0].segments[0].end.y, 6);
        TKAssertFloatEquals(path.subpaths[0].segments[1].end.x, 8);
        TKAssertFloatEquals(path.subpaths[0].segments[1].end.y, 18);
        TKAssertFloatEquals(path.subpaths[0].segments[2].end.x, 2);
        TKAssertFloatEquals(path.subpaths[0].segments[2].end.y, 18);
        TKAssert(path.subpaths[0].closed);
        TKAssertFloatEquals(path.currentPoint.x, 2);
        TKAssertFloatEquals(path.currentPoint.y, 6);
    },

    testAddRoundedRect: function(){
        var path = JSPath.init();
        path.addRoundedRect(JSRect(1, 2, 6, 8), 1);
        TKAssert(!path.empty);
        TKAssertEquals(path.subpaths.length, 1);
        TKAssertFloatEquals(path.currentPoint.x, 1);
        TKAssertFloatEquals(path.currentPoint.y, 3);
        TKAssertFloatEquals(path.subpaths[0].firstPoint.x, 1);
        TKAssertFloatEquals(path.subpaths[0].firstPoint.y, 3);
        TKAssertEquals(path.subpaths[0].segments.length, 7);
        TKAssertEquals(path.subpaths[0].segments[0].type, JSPath.SegmentType.curve);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.p1.x, 1);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.p1.y, 3);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.cp1.x, 1);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.cp1.y, 2.448216);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.cp2.x, 1.448216);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.cp2.y, 2);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.p2.x, 2);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.p2.y, 2);
        TKAssertEquals(path.subpaths[0].segments[1].type, JSPath.SegmentType.line);
        TKAssertFloatEquals(path.subpaths[0].segments[1].end.x, 6);
        TKAssertFloatEquals(path.subpaths[0].segments[1].end.y, 2);
        TKAssertEquals(path.subpaths[0].segments[2].type, JSPath.SegmentType.curve);
        TKAssertFloatEquals(path.subpaths[0].segments[2].curve.p1.x, 6);
        TKAssertFloatEquals(path.subpaths[0].segments[2].curve.p1.y, 2);
        TKAssertFloatEquals(path.subpaths[0].segments[2].curve.cp1.x, 6.551784);
        TKAssertFloatEquals(path.subpaths[0].segments[2].curve.cp1.y, 2);
        TKAssertFloatEquals(path.subpaths[0].segments[2].curve.cp2.x, 7);
        TKAssertFloatEquals(path.subpaths[0].segments[2].curve.cp2.y, 2.448216);
        TKAssertFloatEquals(path.subpaths[0].segments[2].curve.p2.x, 7);
        TKAssertFloatEquals(path.subpaths[0].segments[2].curve.p2.y, 3);
        TKAssertEquals(path.subpaths[0].segments[3].type, JSPath.SegmentType.line);
        TKAssertFloatEquals(path.subpaths[0].segments[3].end.x, 7);
        TKAssertFloatEquals(path.subpaths[0].segments[3].end.y, 9);
        TKAssertEquals(path.subpaths[0].segments[4].type, JSPath.SegmentType.curve);
        TKAssertFloatEquals(path.subpaths[0].segments[4].curve.p1.x, 7);
        TKAssertFloatEquals(path.subpaths[0].segments[4].curve.p1.y, 9);
        TKAssertFloatEquals(path.subpaths[0].segments[4].curve.cp1.x, 7);
        TKAssertFloatEquals(path.subpaths[0].segments[4].curve.cp1.y, 9.551784);
        TKAssertFloatEquals(path.subpaths[0].segments[4].curve.cp2.x, 6.551784);
        TKAssertFloatEquals(path.subpaths[0].segments[4].curve.cp2.y, 10);
        TKAssertFloatEquals(path.subpaths[0].segments[4].curve.p2.x, 6);
        TKAssertFloatEquals(path.subpaths[0].segments[4].curve.p2.y, 10);
        TKAssertEquals(path.subpaths[0].segments[5].type, JSPath.SegmentType.line);
        TKAssertFloatEquals(path.subpaths[0].segments[5].end.x, 2);
        TKAssertFloatEquals(path.subpaths[0].segments[5].end.y, 10);
        TKAssertEquals(path.subpaths[0].segments[6].type, JSPath.SegmentType.curve);
        TKAssertFloatEquals(path.subpaths[0].segments[6].curve.p1.x, 2);
        TKAssertFloatEquals(path.subpaths[0].segments[6].curve.p1.y, 10);
        TKAssertFloatEquals(path.subpaths[0].segments[6].curve.cp1.x, 1.448216);
        TKAssertFloatEquals(path.subpaths[0].segments[6].curve.cp1.y, 10);
        TKAssertFloatEquals(path.subpaths[0].segments[6].curve.cp2.x, 1);
        TKAssertFloatEquals(path.subpaths[0].segments[6].curve.cp2.y, 9.551784);
        TKAssertFloatEquals(path.subpaths[0].segments[6].curve.p2.x, 1);
        TKAssertFloatEquals(path.subpaths[0].segments[6].curve.p2.y, 9);
        TKAssert(path.subpaths[0].closed);

        // transform
        var transform = JSAffineTransform.Scaled(2, 3);
        path = JSPath.init();
        path.addRoundedRect(JSRect(1, 2, 6, 8), 1, transform);
        TKAssert(!path.empty);
        TKAssertEquals(path.subpaths.length, 1);
        TKAssertFloatEquals(path.currentPoint.x, 2);
        TKAssertFloatEquals(path.currentPoint.y, 9);
        TKAssertFloatEquals(path.subpaths[0].firstPoint.x, 2);
        TKAssertFloatEquals(path.subpaths[0].firstPoint.y, 9);
        TKAssertEquals(path.subpaths[0].segments.length, 7);
        TKAssertEquals(path.subpaths[0].segments[0].type, JSPath.SegmentType.curve);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.p1.x, 2);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.p1.y, 9);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.cp1.x, 2);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.cp1.y, 7.344648);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.cp2.x, 2.896432);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.cp2.y, 6);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.p2.x, 4);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.p2.y, 6);
        TKAssertEquals(path.subpaths[0].segments[1].type, JSPath.SegmentType.line);
        TKAssertFloatEquals(path.subpaths[0].segments[1].end.x, 12);
        TKAssertFloatEquals(path.subpaths[0].segments[1].end.y, 6);
        TKAssertEquals(path.subpaths[0].segments[2].type, JSPath.SegmentType.curve);
        TKAssertFloatEquals(path.subpaths[0].segments[2].curve.p1.x, 12);
        TKAssertFloatEquals(path.subpaths[0].segments[2].curve.p1.y, 6);
        TKAssertFloatEquals(path.subpaths[0].segments[2].curve.cp1.x, 13.103568);
        TKAssertFloatEquals(path.subpaths[0].segments[2].curve.cp1.y, 6);
        TKAssertFloatEquals(path.subpaths[0].segments[2].curve.cp2.x, 14);
        TKAssertFloatEquals(path.subpaths[0].segments[2].curve.cp2.y, 7.344648);
        TKAssertFloatEquals(path.subpaths[0].segments[2].curve.p2.x, 14);
        TKAssertFloatEquals(path.subpaths[0].segments[2].curve.p2.y, 9);
        TKAssertEquals(path.subpaths[0].segments[3].type, JSPath.SegmentType.line);
        TKAssertFloatEquals(path.subpaths[0].segments[3].end.x, 14);
        TKAssertFloatEquals(path.subpaths[0].segments[3].end.y, 27);
        TKAssertEquals(path.subpaths[0].segments[4].type, JSPath.SegmentType.curve);
        TKAssertFloatEquals(path.subpaths[0].segments[4].curve.p1.x, 14);
        TKAssertFloatEquals(path.subpaths[0].segments[4].curve.p1.y, 27);
        TKAssertFloatEquals(path.subpaths[0].segments[4].curve.cp1.x, 14);
        TKAssertFloatEquals(path.subpaths[0].segments[4].curve.cp1.y, 28.655352);
        TKAssertFloatEquals(path.subpaths[0].segments[4].curve.cp2.x, 13.103568);
        TKAssertFloatEquals(path.subpaths[0].segments[4].curve.cp2.y, 30);
        TKAssertFloatEquals(path.subpaths[0].segments[4].curve.p2.x, 12);
        TKAssertFloatEquals(path.subpaths[0].segments[4].curve.p2.y, 30);
        TKAssertEquals(path.subpaths[0].segments[5].type, JSPath.SegmentType.line);
        TKAssertFloatEquals(path.subpaths[0].segments[5].end.x, 4);
        TKAssertFloatEquals(path.subpaths[0].segments[5].end.y, 30);
        TKAssertEquals(path.subpaths[0].segments[6].type, JSPath.SegmentType.curve);
        TKAssertFloatEquals(path.subpaths[0].segments[6].curve.p1.x, 4);
        TKAssertFloatEquals(path.subpaths[0].segments[6].curve.p1.y, 30);
        TKAssertFloatEquals(path.subpaths[0].segments[6].curve.cp1.x, 2.896432);
        TKAssertFloatEquals(path.subpaths[0].segments[6].curve.cp1.y, 30);
        TKAssertFloatEquals(path.subpaths[0].segments[6].curve.cp2.x, 2);
        TKAssertFloatEquals(path.subpaths[0].segments[6].curve.cp2.y, 28.655352);
        TKAssertFloatEquals(path.subpaths[0].segments[6].curve.p2.x, 2);
        TKAssertFloatEquals(path.subpaths[0].segments[6].curve.p2.y, 27);
        TKAssert(path.subpaths[0].closed);

        // radius limits
        path = JSPath.init();
        path.addRoundedRect(JSRect(0, 0, 2, 2), 2);
        TKAssert(!path.empty);
        TKAssertEquals(path.subpaths.length, 1);
        TKAssertFloatEquals(path.currentPoint.x, 0);
        TKAssertFloatEquals(path.currentPoint.y, 1);
        TKAssertFloatEquals(path.subpaths[0].firstPoint.x, 0);
        TKAssertFloatEquals(path.subpaths[0].firstPoint.y, 1);
        TKAssertEquals(path.subpaths[0].segments.length, 7);
        TKAssertEquals(path.subpaths[0].segments[0].type, JSPath.SegmentType.curve);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.p1.x, 0);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.p1.y, 1);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.cp1.x, 0);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.cp1.y, 0.448216);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.cp2.x, 0.448216);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.cp2.y, 0);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.p2.x, 1);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.p2.y, 0);
    },

    testAddEllipseInRect: function(){
        var path = JSPath.init();
        path.addEllipseInRect(JSRect(1, 2, 3, 4));
        TKAssert(!path.empty);
        TKAssertEquals(path.subpaths.length, 1);
        TKAssertFloatEquals(path.currentPoint.x, 2.5);
        TKAssertFloatEquals(path.currentPoint.y, 2);
        TKAssertFloatEquals(path.subpaths[0].firstPoint.x, 2.5);
        TKAssertFloatEquals(path.subpaths[0].firstPoint.y, 2);
        TKAssertEquals(path.subpaths[0].segments.length, 4);
        TKAssertEquals(path.subpaths[0].segments[0].type, JSPath.SegmentType.curve);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.p1.x, 2.5);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.p1.y, 2);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.cp1.x, 3.327676);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.cp1.y, 2);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.cp2.x, 4);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.cp2.y, 2.896432);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.p2.x, 4);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.p2.y, 4);
        TKAssertEquals(path.subpaths[0].segments[1].type, JSPath.SegmentType.curve);
        TKAssertFloatEquals(path.subpaths[0].segments[1].curve.p1.x, 4);
        TKAssertFloatEquals(path.subpaths[0].segments[1].curve.p1.y, 4);
        TKAssertFloatEquals(path.subpaths[0].segments[1].curve.cp1.x, 4);
        TKAssertFloatEquals(path.subpaths[0].segments[1].curve.cp1.y, 5.103568);
        TKAssertFloatEquals(path.subpaths[0].segments[1].curve.cp2.x, 3.327676);
        TKAssertFloatEquals(path.subpaths[0].segments[1].curve.cp2.y, 6);
        TKAssertFloatEquals(path.subpaths[0].segments[1].curve.p2.x, 2.5);
        TKAssertFloatEquals(path.subpaths[0].segments[1].curve.p2.y, 6);
        TKAssertEquals(path.subpaths[0].segments[2].type, JSPath.SegmentType.curve);
        TKAssertFloatEquals(path.subpaths[0].segments[2].curve.p1.x, 2.5);
        TKAssertFloatEquals(path.subpaths[0].segments[2].curve.p1.y, 6);
        TKAssertFloatEquals(path.subpaths[0].segments[2].curve.cp1.x, 1.672324);
        TKAssertFloatEquals(path.subpaths[0].segments[2].curve.cp1.y, 6);
        TKAssertFloatEquals(path.subpaths[0].segments[2].curve.cp2.x, 1);
        TKAssertFloatEquals(path.subpaths[0].segments[2].curve.cp2.y, 5.103568);
        TKAssertFloatEquals(path.subpaths[0].segments[2].curve.p2.x, 1);
        TKAssertFloatEquals(path.subpaths[0].segments[2].curve.p2.y, 4);
        TKAssertEquals(path.subpaths[0].segments[3].type, JSPath.SegmentType.curve);
        TKAssertFloatEquals(path.subpaths[0].segments[3].curve.p1.x, 1);
        TKAssertFloatEquals(path.subpaths[0].segments[3].curve.p1.y, 4);
        TKAssertFloatEquals(path.subpaths[0].segments[3].curve.cp1.x, 1);
        TKAssertFloatEquals(path.subpaths[0].segments[3].curve.cp1.y, 2.896432);
        TKAssertFloatEquals(path.subpaths[0].segments[3].curve.cp2.x, 1.672324);
        TKAssertFloatEquals(path.subpaths[0].segments[3].curve.cp2.y, 2);
        TKAssertFloatEquals(path.subpaths[0].segments[3].curve.p2.x, 2.5);
        TKAssertFloatEquals(path.subpaths[0].segments[3].curve.p2.y, 2);
        TKAssert(path.subpaths[0].closed);

        // transform
        var transform = JSAffineTransform.Scaled(-1, -1);
        path = JSPath.init();
        path.addEllipseInRect(JSRect(1, 2, 3, 4), transform);
        TKAssert(!path.empty);
        TKAssertEquals(path.subpaths.length, 1);
        TKAssertFloatEquals(path.currentPoint.x, -2.5);
        TKAssertFloatEquals(path.currentPoint.y, -2);
        TKAssertFloatEquals(path.subpaths[0].firstPoint.x, -2.5);
        TKAssertFloatEquals(path.subpaths[0].firstPoint.y, -2);
        TKAssertEquals(path.subpaths[0].segments.length, 4);
        TKAssertEquals(path.subpaths[0].segments[0].type, JSPath.SegmentType.curve);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.p1.x, -2.5);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.p1.y, -2);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.cp1.x, -3.327676);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.cp1.y, -2);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.cp2.x, -4);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.cp2.y, -2.896432);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.p2.x, -4);
        TKAssertFloatEquals(path.subpaths[0].segments[0].curve.p2.y, -4);
        TKAssertEquals(path.subpaths[0].segments[1].type, JSPath.SegmentType.curve);
        TKAssertFloatEquals(path.subpaths[0].segments[1].curve.p1.x, -4);
        TKAssertFloatEquals(path.subpaths[0].segments[1].curve.p1.y, -4);
        TKAssertFloatEquals(path.subpaths[0].segments[1].curve.cp1.x, -4);
        TKAssertFloatEquals(path.subpaths[0].segments[1].curve.cp1.y, -5.103568);
        TKAssertFloatEquals(path.subpaths[0].segments[1].curve.cp2.x, -3.327676);
        TKAssertFloatEquals(path.subpaths[0].segments[1].curve.cp2.y, -6);
        TKAssertFloatEquals(path.subpaths[0].segments[1].curve.p2.x, -2.5);
        TKAssertFloatEquals(path.subpaths[0].segments[1].curve.p2.y, -6);
        TKAssertEquals(path.subpaths[0].segments[2].type, JSPath.SegmentType.curve);
        TKAssertFloatEquals(path.subpaths[0].segments[2].curve.p1.x, -2.5);
        TKAssertFloatEquals(path.subpaths[0].segments[2].curve.p1.y, -6);
        TKAssertFloatEquals(path.subpaths[0].segments[2].curve.cp1.x, -1.672324);
        TKAssertFloatEquals(path.subpaths[0].segments[2].curve.cp1.y, -6);
        TKAssertFloatEquals(path.subpaths[0].segments[2].curve.cp2.x, -1);
        TKAssertFloatEquals(path.subpaths[0].segments[2].curve.cp2.y, -5.103568);
        TKAssertFloatEquals(path.subpaths[0].segments[2].curve.p2.x, -1);
        TKAssertFloatEquals(path.subpaths[0].segments[2].curve.p2.y, -4);
        TKAssertEquals(path.subpaths[0].segments[3].type, JSPath.SegmentType.curve);
        TKAssertFloatEquals(path.subpaths[0].segments[3].curve.p1.x, -1);
        TKAssertFloatEquals(path.subpaths[0].segments[3].curve.p1.y, -4);
        TKAssertFloatEquals(path.subpaths[0].segments[3].curve.cp1.x, -1);
        TKAssertFloatEquals(path.subpaths[0].segments[3].curve.cp1.y, -2.896432);
        TKAssertFloatEquals(path.subpaths[0].segments[3].curve.cp2.x, -1.672324);
        TKAssertFloatEquals(path.subpaths[0].segments[3].curve.cp2.y, -2);
        TKAssertFloatEquals(path.subpaths[0].segments[3].curve.p2.x, -2.5);
        TKAssertFloatEquals(path.subpaths[0].segments[3].curve.p2.y, -2);
        TKAssert(path.subpaths[0].closed);
    },

    testBoundingRect: function(){
        var path = JSPath.init();
        TKAssertNull(path.boundingRect);
        path.moveToPoint(JSPoint(1, 2));
        TKAssertNotNull(path.boundingRect);
        TKAssertFloatEquals(path.boundingRect.origin.x, 1);
        TKAssertFloatEquals(path.boundingRect.origin.y, 2);
        TKAssertFloatEquals(path.boundingRect.size.width, 0);
        TKAssertFloatEquals(path.boundingRect.size.height, 0);
        path.addLineToPoint(JSPoint(3, 2));
        TKAssertFloatEquals(path.boundingRect.origin.x, 1);
        TKAssertFloatEquals(path.boundingRect.origin.y, 2);
        TKAssertFloatEquals(path.boundingRect.size.width, 2);
        TKAssertFloatEquals(path.boundingRect.size.height, 0);
        path.addLineToPoint(JSPoint(3, 5));
        TKAssertFloatEquals(path.boundingRect.origin.x, 1);
        TKAssertFloatEquals(path.boundingRect.origin.y, 2);
        TKAssertFloatEquals(path.boundingRect.size.width, 2);
        TKAssertFloatEquals(path.boundingRect.size.height, 3);
        path.addLineToPoint(JSPoint(1, 5));
        TKAssertFloatEquals(path.boundingRect.origin.x, 1);
        TKAssertFloatEquals(path.boundingRect.origin.y, 2);
        TKAssertFloatEquals(path.boundingRect.size.width, 2);
        TKAssertFloatEquals(path.boundingRect.size.height, 3);
        path.closeSubpath();
        TKAssertFloatEquals(path.boundingRect.origin.x, 1);
        TKAssertFloatEquals(path.boundingRect.origin.y, 2);
        TKAssertFloatEquals(path.boundingRect.size.width, 2);
        TKAssertFloatEquals(path.boundingRect.size.height, 3);

        path = JSPath.init();
        path.moveToPoint(JSPoint(3, 4));
        path.addCurveToPoint(JSPoint(3, 5), JSPoint(3.2, 4.2), JSPoint(2.8, 4.8));
        TKAssertFloatEquals(path.boundingRect.origin.x, 2.9422649);
        TKAssertFloatEquals(path.boundingRect.origin.y, 4);
        TKAssertFloatEquals(path.boundingRect.size.width, 0.1154700);
        TKAssertFloatEquals(path.boundingRect.size.height, 1);

        path = JSPath.init();
        path.addRect(JSRect(2, 3, 4, 5));
        TKAssertFloatEquals(path.boundingRect.origin.x, 2);
        TKAssertFloatEquals(path.boundingRect.origin.y, 3);
        TKAssertFloatEquals(path.boundingRect.size.width, 4);
        TKAssertFloatEquals(path.boundingRect.size.height, 5);

        path = JSPath.init();
        path.addRoundedRect(JSRect(2, 3, 4, 5), 0.2);
        TKAssertFloatEquals(path.boundingRect.origin.x, 2);
        TKAssertFloatEquals(path.boundingRect.origin.y, 3);
        TKAssertFloatEquals(path.boundingRect.size.width, 4);
        TKAssertFloatEquals(path.boundingRect.size.height, 5);

        path = JSPath.init();
        path.addEllipseInRect(JSRect(2, 3, 4, 5));
        TKAssertFloatEquals(path.boundingRect.origin.x, 2);
        TKAssertFloatEquals(path.boundingRect.origin.y, 3);
        TKAssertFloatEquals(path.boundingRect.size.width, 4);
        TKAssertFloatEquals(path.boundingRect.size.height, 5);
    },

    testContainsPointRectangle: function(){
        // Rectangle in the normal direction
        var path = JSPath.init();
        path.moveToPoint(JSPoint(1, 2));
        path.addLineToPoint(JSPoint(4, 2));
        path.addLineToPoint(JSPoint(4, 6));
        path.addLineToPoint(JSPoint(1, 6));
        path.closeSubpath();
        // ..winding rule
        // ....center
        TKAssert(path.containsPoint(JSPoint(2, 4), JSContext.FillRule.winding));
        // ....corners
        TKAssert(path.containsPoint(JSPoint(1, 2), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(4, 2), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(4, 6), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(1, 6), JSContext.FillRule.winding));
        // ....edge midpoints
        TKAssert(path.containsPoint(JSPoint(2.5, 2), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(4, 4), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(2.5, 6), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(1, 4), JSContext.FillRule.winding));
        // ....outside
        TKAssert(!path.containsPoint(JSPoint(2, 1), JSContext.FillRule.winding));
        TKAssert(!path.containsPoint(JSPoint(2, 7), JSContext.FillRule.winding));
        TKAssert(!path.containsPoint(JSPoint(0, 4), JSContext.FillRule.winding));
        TKAssert(!path.containsPoint(JSPoint(5, 4), JSContext.FillRule.winding));
        // ..even odd rule
        // ....center
        TKAssert(path.containsPoint(JSPoint(2, 4), JSContext.FillRule.evenOdd));
        // ....corners
        TKAssert(path.containsPoint(JSPoint(1, 2), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(4, 2), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(4, 6), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(1, 6), JSContext.FillRule.evenOdd));
        // ....edge midpoints
        TKAssert(path.containsPoint(JSPoint(2.5, 2), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(4, 4), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(2.5, 6), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(1, 4), JSContext.FillRule.evenOdd));
        // ....outside
        TKAssert(!path.containsPoint(JSPoint(2, 1), JSContext.FillRule.evenOdd));
        TKAssert(!path.containsPoint(JSPoint(2, 7), JSContext.FillRule.evenOdd));
        TKAssert(!path.containsPoint(JSPoint(0, 4), JSContext.FillRule.evenOdd));
        TKAssert(!path.containsPoint(JSPoint(5, 4), JSContext.FillRule.evenOdd));

        // Rectangle in the reverse direction
        path = JSPath.init();
        path.moveToPoint(JSPoint(1, 2));
        path.addLineToPoint(JSPoint(1, 6));
        path.addLineToPoint(JSPoint(4, 6));
        path.addLineToPoint(JSPoint(4, 2));
        path.closeSubpath();
        // ..winding rule
        // ....center
        TKAssert(path.containsPoint(JSPoint(2, 4), JSContext.FillRule.winding));
        // ....corners
        TKAssert(path.containsPoint(JSPoint(1, 2), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(4, 2), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(4, 6), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(1, 6), JSContext.FillRule.winding));
        // ....edge midpoints
        TKAssert(path.containsPoint(JSPoint(2.5, 2), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(4, 4), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(2.5, 6), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(1, 4), JSContext.FillRule.winding));
        // ....outside
        TKAssert(!path.containsPoint(JSPoint(2, 1), JSContext.FillRule.winding));
        TKAssert(!path.containsPoint(JSPoint(2, 7), JSContext.FillRule.winding));
        TKAssert(!path.containsPoint(JSPoint(0, 4), JSContext.FillRule.winding));
        TKAssert(!path.containsPoint(JSPoint(5, 4), JSContext.FillRule.winding));
        // ..even odd rule
        // ....center
        TKAssert(path.containsPoint(JSPoint(2, 4), JSContext.FillRule.evenOdd));
        // ....corners
        TKAssert(path.containsPoint(JSPoint(1, 2), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(4, 2), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(4, 6), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(1, 6), JSContext.FillRule.evenOdd));
        // ....edge midpoints
        TKAssert(path.containsPoint(JSPoint(2.5, 2), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(4, 4), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(2.5, 6), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(1, 4), JSContext.FillRule.evenOdd));
        // ....outside
        TKAssert(!path.containsPoint(JSPoint(2, 1), JSContext.FillRule.evenOdd));
        TKAssert(!path.containsPoint(JSPoint(2, 7), JSContext.FillRule.evenOdd));
        TKAssert(!path.containsPoint(JSPoint(0, 4), JSContext.FillRule.evenOdd));
        TKAssert(!path.containsPoint(JSPoint(5, 4), JSContext.FillRule.evenOdd));

        // Rectangle open left edge
        path = JSPath.init();
        path.moveToPoint(JSPoint(1, 2));
        path.addLineToPoint(JSPoint(4, 2));
        path.addLineToPoint(JSPoint(4, 6));
        path.addLineToPoint(JSPoint(1, 6));
        // ..winding rule
        // ....center
        TKAssert(path.containsPoint(JSPoint(2, 4), JSContext.FillRule.winding));
        // ....corners
        TKAssert(path.containsPoint(JSPoint(1, 2), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(4, 2), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(4, 6), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(1, 6), JSContext.FillRule.winding));
        // ....edge midpoints
        TKAssert(path.containsPoint(JSPoint(2.5, 2), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(4, 4), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(2.5, 6), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(1, 4), JSContext.FillRule.winding));
        // ....outside
        TKAssert(!path.containsPoint(JSPoint(2, 1), JSContext.FillRule.winding));
        TKAssert(!path.containsPoint(JSPoint(2, 7), JSContext.FillRule.winding));
        TKAssert(!path.containsPoint(JSPoint(0, 4), JSContext.FillRule.winding));
        TKAssert(!path.containsPoint(JSPoint(5, 4), JSContext.FillRule.winding));
        // ..even odd rule
        // ....center
        TKAssert(path.containsPoint(JSPoint(2, 4), JSContext.FillRule.evenOdd));
        // ....corners
        TKAssert(path.containsPoint(JSPoint(1, 2), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(4, 2), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(4, 6), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(1, 6), JSContext.FillRule.evenOdd));
        // ....edge midpoints
        TKAssert(path.containsPoint(JSPoint(2.5, 2), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(4, 4), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(2.5, 6), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(1, 4), JSContext.FillRule.evenOdd));
        // ....outside
        TKAssert(!path.containsPoint(JSPoint(2, 1), JSContext.FillRule.evenOdd));
        TKAssert(!path.containsPoint(JSPoint(2, 7), JSContext.FillRule.evenOdd));
        TKAssert(!path.containsPoint(JSPoint(0, 4), JSContext.FillRule.evenOdd));
        TKAssert(!path.containsPoint(JSPoint(5, 4), JSContext.FillRule.evenOdd));

        // Rectangle open top edge
        path = JSPath.init();
        path.moveToPoint(JSPoint(4, 2));
        path.addLineToPoint(JSPoint(4, 6));
        path.addLineToPoint(JSPoint(1, 6));
        path.addLineToPoint(JSPoint(1, 2));
        // ..winding rule
        // ....center
        TKAssert(path.containsPoint(JSPoint(2, 4), JSContext.FillRule.winding));
        // ....corners
        TKAssert(path.containsPoint(JSPoint(1, 2), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(4, 2), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(4, 6), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(1, 6), JSContext.FillRule.winding));
        // ....edge midpoints
        TKAssert(path.containsPoint(JSPoint(2.5, 2), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(4, 4), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(2.5, 6), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(1, 4), JSContext.FillRule.winding));
        // ....outside
        TKAssert(!path.containsPoint(JSPoint(2, 1), JSContext.FillRule.winding));
        TKAssert(!path.containsPoint(JSPoint(2, 7), JSContext.FillRule.winding));
        TKAssert(!path.containsPoint(JSPoint(0, 4), JSContext.FillRule.winding));
        TKAssert(!path.containsPoint(JSPoint(5, 4), JSContext.FillRule.winding));
        // ..even odd rule
        // ....center
        TKAssert(path.containsPoint(JSPoint(2, 4), JSContext.FillRule.evenOdd));
        // ....corners
        TKAssert(path.containsPoint(JSPoint(1, 2), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(4, 2), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(4, 6), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(1, 6), JSContext.FillRule.evenOdd));
        // ....edge midpoints
        TKAssert(path.containsPoint(JSPoint(2.5, 2), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(4, 4), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(2.5, 6), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(1, 4), JSContext.FillRule.evenOdd));
        // ....outside
        TKAssert(!path.containsPoint(JSPoint(2, 1), JSContext.FillRule.evenOdd));
        TKAssert(!path.containsPoint(JSPoint(2, 7), JSContext.FillRule.evenOdd));
        TKAssert(!path.containsPoint(JSPoint(0, 4), JSContext.FillRule.evenOdd));
        TKAssert(!path.containsPoint(JSPoint(5, 4), JSContext.FillRule.evenOdd));

        // Rectangle open right edge
        path = JSPath.init();
        path.moveToPoint(JSPoint(4, 6));
        path.addLineToPoint(JSPoint(1, 6));
        path.addLineToPoint(JSPoint(1, 2));
        path.addLineToPoint(JSPoint(4, 2));
        // ..winding rule
        // ....center
        TKAssert(path.containsPoint(JSPoint(2, 4), JSContext.FillRule.winding));
        // ....corners
        TKAssert(path.containsPoint(JSPoint(1, 2), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(4, 2), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(4, 6), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(1, 6), JSContext.FillRule.winding));
        // ....edge midpoints
        TKAssert(path.containsPoint(JSPoint(2.5, 2), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(4, 4), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(2.5, 6), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(1, 4), JSContext.FillRule.winding));
        // ....outside
        TKAssert(!path.containsPoint(JSPoint(2, 1), JSContext.FillRule.winding));
        TKAssert(!path.containsPoint(JSPoint(2, 7), JSContext.FillRule.winding));
        TKAssert(!path.containsPoint(JSPoint(0, 4), JSContext.FillRule.winding));
        TKAssert(!path.containsPoint(JSPoint(5, 4), JSContext.FillRule.winding));
        // ..even odd rule
        // ....center
        TKAssert(path.containsPoint(JSPoint(2, 4), JSContext.FillRule.evenOdd));
        // ....corners
        TKAssert(path.containsPoint(JSPoint(1, 2), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(4, 2), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(4, 6), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(1, 6), JSContext.FillRule.evenOdd));
        // ....edge midpoints
        TKAssert(path.containsPoint(JSPoint(2.5, 2), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(4, 4), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(2.5, 6), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(1, 4), JSContext.FillRule.evenOdd));
        // ....outside
        TKAssert(!path.containsPoint(JSPoint(2, 1), JSContext.FillRule.evenOdd));
        TKAssert(!path.containsPoint(JSPoint(2, 7), JSContext.FillRule.evenOdd));
        TKAssert(!path.containsPoint(JSPoint(0, 4), JSContext.FillRule.evenOdd));
        TKAssert(!path.containsPoint(JSPoint(5, 4), JSContext.FillRule.evenOdd));

        // Rectangle open bottom edge
        path = JSPath.init();
        path.moveToPoint(JSPoint(1, 6));
        path.addLineToPoint(JSPoint(1, 2));
        path.addLineToPoint(JSPoint(4, 2));
        path.addLineToPoint(JSPoint(4, 6));
        // ..winding rule
        // ....center
        TKAssert(path.containsPoint(JSPoint(2, 4), JSContext.FillRule.winding));
        // ....corners
        TKAssert(path.containsPoint(JSPoint(1, 2), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(4, 2), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(4, 6), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(1, 6), JSContext.FillRule.winding));
        // ....edge midpoints
        TKAssert(path.containsPoint(JSPoint(2.5, 2), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(4, 4), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(2.5, 6), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(1, 4), JSContext.FillRule.winding));
        // ....outside
        TKAssert(!path.containsPoint(JSPoint(2, 1), JSContext.FillRule.winding));
        TKAssert(!path.containsPoint(JSPoint(2, 7), JSContext.FillRule.winding));
        TKAssert(!path.containsPoint(JSPoint(0, 4), JSContext.FillRule.winding));
        TKAssert(!path.containsPoint(JSPoint(5, 4), JSContext.FillRule.winding));
        // ..even odd rule
        // ....center
        TKAssert(path.containsPoint(JSPoint(2, 4), JSContext.FillRule.evenOdd));
        // ....corners
        TKAssert(path.containsPoint(JSPoint(1, 2), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(4, 2), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(4, 6), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(1, 6), JSContext.FillRule.evenOdd));
        // ....edge midpoints
        TKAssert(path.containsPoint(JSPoint(2.5, 2), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(4, 4), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(2.5, 6), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(1, 4), JSContext.FillRule.evenOdd));
        // ....outside
        TKAssert(!path.containsPoint(JSPoint(2, 1), JSContext.FillRule.evenOdd));
        TKAssert(!path.containsPoint(JSPoint(2, 7), JSContext.FillRule.evenOdd));
        TKAssert(!path.containsPoint(JSPoint(0, 4), JSContext.FillRule.evenOdd));
        TKAssert(!path.containsPoint(JSPoint(5, 4), JSContext.FillRule.evenOdd));
    },

    testContainsPointRectangleHole: function(){
        // Rectangle in the normal direction, inner in same direction
        var path = JSPath.init();
        path.moveToPoint(JSPoint(-4, -4));
        path.addLineToPoint(JSPoint(4, -4));
        path.addLineToPoint(JSPoint(4, 4));
        path.addLineToPoint(JSPoint(-4, 4));
        path.closeSubpath();
        path.moveToPoint(JSPoint(-1, -1));
        path.addLineToPoint(JSPoint(1, -1));
        path.addLineToPoint(JSPoint(1, 1));
        path.addLineToPoint(JSPoint(-1, 1));
        path.closeSubpath();
        // ..winding rule
        // ....center
        TKAssert(path.containsPoint(JSPoint(0, 0), JSContext.FillRule.winding));
        // ....outside corners
        TKAssert(path.containsPoint(JSPoint(-4, -4), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(4, -4), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(4, 4), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(-4, 4), JSContext.FillRule.winding));
        // ....inside corners
        TKAssert(path.containsPoint(JSPoint(-1, -1), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(1, -1), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(1, 1), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(-1, 1), JSContext.FillRule.winding));
        // ....outside edge midpoints
        TKAssert(path.containsPoint(JSPoint(0, -4), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(4, 0), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(0, 4), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(0, -4), JSContext.FillRule.winding));
        // ....inside edge midpoints
        TKAssert(path.containsPoint(JSPoint(0, -1), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(1, 0), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(0, 1), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(0, -1), JSContext.FillRule.winding));
        // ....between innter and outer edges
        TKAssert(path.containsPoint(JSPoint(0, -2.5), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(2.5, 0), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(0, 2.5), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(0, -2.5), JSContext.FillRule.winding));
        // ....outside
        TKAssert(!path.containsPoint(JSPoint(0, -5), JSContext.FillRule.winding));
        TKAssert(!path.containsPoint(JSPoint(5, 0), JSContext.FillRule.winding));
        TKAssert(!path.containsPoint(JSPoint(0, 5), JSContext.FillRule.winding));
        TKAssert(!path.containsPoint(JSPoint(-5, 0), JSContext.FillRule.winding));
        // ..even odd rule
        // ....center
        TKAssert(!path.containsPoint(JSPoint(0, 0), JSContext.FillRule.evenOdd));
        // ....outside corners
        TKAssert(path.containsPoint(JSPoint(-4, -4), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(4, -4), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(4, 4), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(-4, 4), JSContext.FillRule.evenOdd));
        // ....inside corners
        TKAssert(path.containsPoint(JSPoint(-1, -1), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(1, -1), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(1, 1), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(-1, 1), JSContext.FillRule.evenOdd));
        // ....outside edge midpoints
        TKAssert(path.containsPoint(JSPoint(0, -4), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(4, 0), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(0, 4), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(0, -4), JSContext.FillRule.evenOdd));
        // ....inside edge midpoints
        TKAssert(path.containsPoint(JSPoint(0, -1), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(1, 0), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(0, 1), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(0, -1), JSContext.FillRule.evenOdd));
        // ....between innter and outer edges
        TKAssert(path.containsPoint(JSPoint(0, -2.5), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(2.5, 0), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(0, 2.5), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(0, -2.5), JSContext.FillRule.evenOdd));
        // ....outside
        TKAssert(!path.containsPoint(JSPoint(0, -5), JSContext.FillRule.evenOdd));
        TKAssert(!path.containsPoint(JSPoint(5, 0), JSContext.FillRule.evenOdd));
        TKAssert(!path.containsPoint(JSPoint(0, 5), JSContext.FillRule.evenOdd));
        TKAssert(!path.containsPoint(JSPoint(-5, 0), JSContext.FillRule.evenOdd));

        // Rectangle in the normal direction, inner in opposite direction
        path = JSPath.init();
        path.moveToPoint(JSPoint(-4, -4));
        path.addLineToPoint(JSPoint(4, -4));
        path.addLineToPoint(JSPoint(4, 4));
        path.addLineToPoint(JSPoint(-4, 4));
        path.closeSubpath();
        path.moveToPoint(JSPoint(-1, -1));
        path.addLineToPoint(JSPoint(-1, 1));
        path.addLineToPoint(JSPoint(1, 1));
        path.addLineToPoint(JSPoint(1, -1));
        path.closeSubpath();
        // ..winding rule
        // ....center
        TKAssert(!path.containsPoint(JSPoint(0, 0), JSContext.FillRule.winding));
        // ....outside corners
        TKAssert(path.containsPoint(JSPoint(-4, -4), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(4, -4), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(4, 4), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(-4, 4), JSContext.FillRule.winding));
        // ....inside corners
        TKAssert(path.containsPoint(JSPoint(-1, -1), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(1, -1), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(1, 1), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(-1, 1), JSContext.FillRule.winding));
        // ....outside edge midpoints
        TKAssert(path.containsPoint(JSPoint(0, -4), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(4, 0), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(0, 4), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(0, -4), JSContext.FillRule.winding));
        // ....inside edge midpoints
        TKAssert(path.containsPoint(JSPoint(0, -1), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(1, 0), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(0, 1), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(0, -1), JSContext.FillRule.winding));
        // ....between innter and outer edges
        TKAssert(path.containsPoint(JSPoint(0, -2.5), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(2.5, 0), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(0, 2.5), JSContext.FillRule.winding));
        TKAssert(path.containsPoint(JSPoint(0, -2.5), JSContext.FillRule.winding));
        // ....outside
        TKAssert(!path.containsPoint(JSPoint(0, -5), JSContext.FillRule.winding));
        TKAssert(!path.containsPoint(JSPoint(5, 0), JSContext.FillRule.winding));
        TKAssert(!path.containsPoint(JSPoint(0, 5), JSContext.FillRule.winding));
        TKAssert(!path.containsPoint(JSPoint(-5, 0), JSContext.FillRule.winding));
        // ..even odd rule
        // ....center
        TKAssert(!path.containsPoint(JSPoint(0, 0), JSContext.FillRule.evenOdd));
        // ....outside corners
        TKAssert(path.containsPoint(JSPoint(-4, -4), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(4, -4), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(4, 4), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(-4, 4), JSContext.FillRule.evenOdd));
        // ....inside corners
        TKAssert(path.containsPoint(JSPoint(-1, -1), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(1, -1), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(1, 1), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(-1, 1), JSContext.FillRule.evenOdd));
        // ....outside edge midpoints
        TKAssert(path.containsPoint(JSPoint(0, -4), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(4, 0), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(0, 4), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(0, -4), JSContext.FillRule.evenOdd));
        // ....inside edge midpoints
        TKAssert(path.containsPoint(JSPoint(0, -1), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(1, 0), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(0, 1), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(0, -1), JSContext.FillRule.evenOdd));
        // ....between innter and outer edges
        TKAssert(path.containsPoint(JSPoint(0, -2.5), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(2.5, 0), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(0, 2.5), JSContext.FillRule.evenOdd));
        TKAssert(path.containsPoint(JSPoint(0, -2.5), JSContext.FillRule.evenOdd));
        // ....outside
        TKAssert(!path.containsPoint(JSPoint(0, -5), JSContext.FillRule.evenOdd));
        TKAssert(!path.containsPoint(JSPoint(5, 0), JSContext.FillRule.evenOdd));
        TKAssert(!path.containsPoint(JSPoint(0, 5), JSContext.FillRule.evenOdd));
        TKAssert(!path.containsPoint(JSPoint(-5, 0), JSContext.FillRule.evenOdd));
    },

    _testCopy: function(){
    },

    _testAddArc: function(){
    },

    _testAddArcUsingTangents: function(){
    },

    _testPathThatFillsStroke: function(){
    },

});
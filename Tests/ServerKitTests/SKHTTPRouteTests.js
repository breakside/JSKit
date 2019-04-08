// #import ServerKit
// #import TestKit
/* global JSClass, TKTestSuite, SKHTTPRoute, JSSpect, JSPropertyList, SKHTTPResponder, SKHTTPResponderContext */
/* global SKHTTPRouteTestsRootResponder, SKHTTPRouteTestsOneResponder, SKHTTPRouteTestsOneAResponder, SKHTTPRouteTestsTwoResponder, SKHTTPRouteTestsThreeResponder, SKHTTPRouteTestsThreeXResponder, SKHTTPRouteTestsFourResponder, SKHTTPRouteTestsRootContext, SKHTTPRouteTestsThreeContext, SKHTTPRouteTestsFourContext */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertThrows */
'use strict';

JSClass("SKHTTPRouteTests", TKTestSuite, {

    testCreateFromMap: function(){
        var routes = {
            "/":            {responder: "SKHTTPRouteTestsRootResponder"},
            "/one":         {responder: "SKHTTPRouteTestsOneResponder"},
            "/one/a":       {responder: "SKHTTPRouteTestsOneAResponder"},
            "/two":         {responder: "SKHTTPRouteTestsTwoResponder"},
            "/three/*id":   {responder: "SKHTTPRouteTestsThreeResponder"},
            "/three/*id/x": {responder: "SKHTTPRouteTestsThreeXResponder"},
            "/four/**file": {responder: "SKHTTPRouteTestsFourResponder"},
        };
        var rootRoute = SKHTTPRoute.CreateFromMap(routes);
        TKAssertNotNull(rootRoute);
        TKAssert(rootRoute.isKindOfClass(SKHTTPRoute));
        TKAssertEquals(rootRoute.children.length, 4);
        var one = rootRoute.children[0];
        TKAssert(one.isKindOfClass(SKHTTPRoute));
        TKAssertEquals(one.children.length, 1);
        var oneA = one.children[0];
        TKAssert(oneA.isKindOfClass(SKHTTPRoute));
        TKAssertEquals(oneA.children.length, 0);
        var two = rootRoute.children[1];
        TKAssert(two.isKindOfClass(SKHTTPRoute));
        TKAssertEquals(two.children.length, 0);
        var three = rootRoute.children[2];
        TKAssert(three.isKindOfClass(SKHTTPRoute));
        TKAssertEquals(three.children.length, 1);
        var threeX = three.children[0];
        TKAssert(threeX.isKindOfClass(SKHTTPRoute));
        TKAssertEquals(threeX.children.length, 0);
        var four = rootRoute.children[3];
        TKAssert(four.isKindOfClass(SKHTTPRoute));
        TKAssertEquals(four.children.length, 0);

        var responder = rootRoute.responderForRequest(null, ['/']);
        TKAssertNotNull(responder);
        TKAssert(responder.isKindOfClass(SKHTTPRouteTestsRootResponder));
        TKAssertNotNull(responder.context);
        TKAssert(responder.context.isKindOfClass(SKHTTPRouteTestsRootContext));

        responder = rootRoute.responderForRequest(null, ['/', 'missing']);
        TKAssertNull(responder);

        responder = rootRoute.responderForRequest(null, ['/', 'one']);
        TKAssertNotNull(responder);
        TKAssert(responder.isKindOfClass(SKHTTPRouteTestsOneResponder));
        TKAssertNotNull(responder.context);
        TKAssert(responder.context.isKindOfClass(SKHTTPRouteTestsRootContext));

        responder = rootRoute.responderForRequest(null, ['/', 'one', 'a']);
        TKAssertNotNull(responder);
        TKAssert(responder.isKindOfClass(SKHTTPRouteTestsOneAResponder));
        TKAssertNotNull(responder.context);
        TKAssert(responder.context.isKindOfClass(SKHTTPRouteTestsRootContext));

        responder = rootRoute.responderForRequest(null, ['/', 'one', 'b']);
        TKAssertNull(responder);

        responder = rootRoute.responderForRequest(null, ['/', 'two']);
        TKAssertNotNull(responder);
        TKAssert(responder.isKindOfClass(SKHTTPRouteTestsTwoResponder));
        TKAssertNotNull(responder.context);
        TKAssert(responder.context.isKindOfClass(SKHTTPRouteTestsRootContext));

        responder = rootRoute.responderForRequest(null, ['/', 'three']);
        TKAssertNull(responder);

        responder = rootRoute.responderForRequest(null, ['/', 'three', 'hello']);
        TKAssertNotNull(responder);
        TKAssert(responder.isKindOfClass(SKHTTPRouteTestsThreeResponder));
        TKAssertNotNull(responder.context);
        TKAssert(responder.context.isKindOfClass(SKHTTPRouteTestsThreeContext));
        TKAssertEquals(responder.context.id, "hello");

        responder = rootRoute.responderForRequest(null, ['/', 'three', 'there']);
        TKAssertNotNull(responder);
        TKAssert(responder.isKindOfClass(SKHTTPRouteTestsThreeResponder));
        TKAssertNotNull(responder.context);
        TKAssert(responder.context.isKindOfClass(SKHTTPRouteTestsThreeContext));
        TKAssertEquals(responder.context.id, "there");

        responder = rootRoute.responderForRequest(null, ['/', 'three', 'hello', 'there']);
        TKAssertNull(responder);

        responder = rootRoute.responderForRequest(null, ['/', 'three', 'hello', 'x']);
        TKAssertNotNull(responder);
        TKAssert(responder.isKindOfClass(SKHTTPRouteTestsThreeXResponder));
        TKAssertNotNull(responder.context);
        TKAssert(responder.context.isKindOfClass(SKHTTPRouteTestsThreeContext));
        TKAssertEquals(responder.context.id, "hello");

        responder = rootRoute.responderForRequest(null, ['/', 'four', 'hello.txt']);
        TKAssertNotNull(responder);
        TKAssert(responder.isKindOfClass(SKHTTPRouteTestsFourResponder));
        TKAssertNotNull(responder.context);
        TKAssert(responder.context.isKindOfClass(SKHTTPRouteTestsFourContext));
        TKAssertEquals(responder.context.file.length, 1);
        TKAssertEquals(responder.context.file[0], "hello.txt");

        responder = rootRoute.responderForRequest(null, ['/', 'four', 'there.pdf']);
        TKAssertNotNull(responder);
        TKAssert(responder.isKindOfClass(SKHTTPRouteTestsFourResponder));
        TKAssertNotNull(responder.context);
        TKAssert(responder.context.isKindOfClass(SKHTTPRouteTestsFourContext));
        TKAssertEquals(responder.context.file.length, 1);
        TKAssertEquals(responder.context.file[0], "there.pdf");

        responder = rootRoute.responderForRequest(null, ['/', 'four', 'hello', 'there.txt']);
        TKAssertNotNull(responder);
        TKAssert(responder.isKindOfClass(SKHTTPRouteTestsFourResponder));
        TKAssertNotNull(responder.context);
        TKAssert(responder.context.isKindOfClass(SKHTTPRouteTestsFourContext));
        TKAssertEquals(responder.context.file.length, 2);
        TKAssertEquals(responder.context.file[0], "hello");
        TKAssertEquals(responder.context.file[1], "there.txt");

        responder = rootRoute.responderForRequest(null, ['/', '', 'hello', 'there.txt']);
        TKAssertNull(responder);
    }

});

JSClass("SKHTTPRouteTestsRootContext", SKHTTPResponderContext, {

});

JSClass("SKHTTPRouteTestsThreeContext", SKHTTPResponderContext, {
    id: null
});

JSClass("SKHTTPRouteTestsFourContext", SKHTTPResponderContext, {
    files: null
});

JSClass("SKHTTPRouteTestsRootResponder", SKHTTPResponder, {

    contextClass: SKHTTPRouteTestsRootContext

});

JSClass("SKHTTPRouteTestsOneResponder", SKHTTPResponder, {

});

JSClass("SKHTTPRouteTestsOneAResponder", SKHTTPResponder, {

});

JSClass("SKHTTPRouteTestsTwoResponder", SKHTTPResponder, {

});

JSClass("SKHTTPRouteTestsThreeResponder", SKHTTPResponder, {

    contextClass: SKHTTPRouteTestsThreeContext

});

JSClass("SKHTTPRouteTestsThreeXResponder", SKHTTPResponder, {

});

JSClass("SKHTTPRouteTestsFourResponder", SKHTTPResponder, {

    contextClass: SKHTTPRouteTestsFourContext
    
});

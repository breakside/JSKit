// #import ServerKit
// #import TestKit
/* global JSClass, TKTestSuite, SKHTTPRoute, JSSpect, JSPropertyList, SKHTTPResponder, SKHTTPResponderContext, SKHTTPRequest, JSURL */
/* global SKHTTPRouteTestsRootResponder, SKHTTPRouteTestsOneResponder, SKHTTPRouteTestsOneAResponder, SKHTTPRouteTestsTwoResponder, SKHTTPRouteTestsThreeResponder, SKHTTPRouteTestsThreeXResponder, SKHTTPRouteTestsFourResponder, SKHTTPRouteTestsRootContext, SKHTTPRouteTestsThreeContext, SKHTTPRouteTestsFourContext */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertThrows, TKAssertArrayEquals */
'use strict';

JSClass("SKHTTPRouteTests", TKTestSuite, {

    testCreateFromMap: function(){
        var routes = {
            "/":            "SKHTTPRouteTestsRootResponder",
            "/one":         "SKHTTPRouteTestsOneResponder",
            "/one/a":       "SKHTTPRouteTestsOneAResponder",
            "/two":         "SKHTTPRouteTestsTwoResponder",
            "/three/*id":   "SKHTTPRouteTestsThreeResponder",
            "/three/*id/x": "SKHTTPRouteTestsThreeXResponder",
            "/four/**file": "SKHTTPRouteTestsFourResponder",
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


        var request = SKHTTPRequest.initWithMethodAndURL("GET", JSURL.initWithString("http://breakside.io/"));
        var routeInfo = rootRoute.routeInfoForRequest(request);
        TKAssertNotNull(routeInfo);
        var context = routeInfo.route.contextWithMatches(routeInfo.matches);
        TKAssertNotNull(context);
        TKAssert(context.isKindOfClass(SKHTTPRouteTestsRootContext));
        var responder = routeInfo.route.responderWithRequest(request, context);
        TKAssertNotNull(responder);
        TKAssert(responder.isKindOfClass(SKHTTPRouteTestsRootResponder));

        request = SKHTTPRequest.initWithMethodAndURL("GET", JSURL.initWithString("http://breakside.io/missing"));
        routeInfo = rootRoute.routeInfoForRequest(request);
        TKAssertNull(routeInfo);

        request = SKHTTPRequest.initWithMethodAndURL("GET", JSURL.initWithString("http://breakside.io/one"));
        routeInfo = rootRoute.routeInfoForRequest(request);
        TKAssertNotNull(routeInfo);
        context = routeInfo.route.contextWithMatches(routeInfo.matches);
        TKAssertNotNull(context);
        TKAssert(context.isKindOfClass(SKHTTPRouteTestsRootContext));
        responder = routeInfo.route.responderWithRequest(request, context);
        TKAssertNotNull(responder);
        TKAssert(responder.isKindOfClass(SKHTTPRouteTestsOneResponder));

        request = SKHTTPRequest.initWithMethodAndURL("GET", JSURL.initWithString("http://breakside.io/one/a"));
        routeInfo = rootRoute.routeInfoForRequest(request);
        TKAssertNotNull(routeInfo);
        context = routeInfo.route.contextWithMatches(routeInfo.matches);
        TKAssertNotNull(context);
        TKAssert(context.isKindOfClass(SKHTTPRouteTestsRootContext));
        responder = routeInfo.route.responderWithRequest(request, context);
        TKAssertNotNull(responder);
        TKAssert(responder.isKindOfClass(SKHTTPRouteTestsOneAResponder));

        request = SKHTTPRequest.initWithMethodAndURL("GET", JSURL.initWithString("http://breakside.io/one/b"));
        routeInfo = rootRoute.routeInfoForRequest(request);
        TKAssertNull(routeInfo);

        request = SKHTTPRequest.initWithMethodAndURL("GET", JSURL.initWithString("http://breakside.io/two"));
        routeInfo = rootRoute.routeInfoForRequest(request);
        TKAssertNotNull(routeInfo);
        context = routeInfo.route.contextWithMatches(routeInfo.matches);
        TKAssertNotNull(context);
        TKAssert(context.isKindOfClass(SKHTTPRouteTestsRootContext));
        responder = routeInfo.route.responderWithRequest(request, context);
        TKAssertNotNull(responder);
        TKAssert(responder.isKindOfClass(SKHTTPRouteTestsTwoResponder));

        request = SKHTTPRequest.initWithMethodAndURL("GET", JSURL.initWithString("http://breakside.io/three"));
        routeInfo = rootRoute.routeInfoForRequest(request);
        TKAssertNull(routeInfo);

        request = SKHTTPRequest.initWithMethodAndURL("GET", JSURL.initWithString("http://breakside.io/three/hello"));
        routeInfo = rootRoute.routeInfoForRequest(request);
        TKAssertNotNull(routeInfo);
        context = routeInfo.route.contextWithMatches(routeInfo.matches);
        TKAssertNotNull(context);
        TKAssertEquals(context.id, "hello");
        TKAssert(context.isKindOfClass(SKHTTPRouteTestsThreeContext));
        responder = routeInfo.route.responderWithRequest(request, context);
        TKAssertNotNull(responder);
        TKAssert(responder.isKindOfClass(SKHTTPRouteTestsThreeResponder));

        request = SKHTTPRequest.initWithMethodAndURL("GET", JSURL.initWithString("http://breakside.io/three/there"));
        routeInfo = rootRoute.routeInfoForRequest(request);
        TKAssertNotNull(routeInfo);
        context = routeInfo.route.contextWithMatches(routeInfo.matches);
        TKAssertNotNull(context);
        TKAssertEquals(context.id, "there");
        TKAssert(context.isKindOfClass(SKHTTPRouteTestsThreeContext));
        responder = routeInfo.route.responderWithRequest(request, context);
        TKAssertNotNull(responder);
        TKAssert(responder.isKindOfClass(SKHTTPRouteTestsThreeResponder));

        request = SKHTTPRequest.initWithMethodAndURL("GET", JSURL.initWithString("http://breakside.io/three/hello/there"));
        routeInfo = rootRoute.routeInfoForRequest(request);
        TKAssertNull(routeInfo);

        request = SKHTTPRequest.initWithMethodAndURL("GET", JSURL.initWithString("http://breakside.io/three/hello/x"));
        routeInfo = rootRoute.routeInfoForRequest(request);
        TKAssertNotNull(routeInfo);
        context = routeInfo.route.contextWithMatches(routeInfo.matches);
        TKAssertNotNull(context);
        TKAssertEquals(context.id, "hello");
        TKAssert(context.isKindOfClass(SKHTTPRouteTestsThreeContext));
        responder = routeInfo.route.responderWithRequest(request, context);
        TKAssertNotNull(responder);
        TKAssert(responder.isKindOfClass(SKHTTPRouteTestsThreeXResponder));

        request = SKHTTPRequest.initWithMethodAndURL("GET", JSURL.initWithString("http://breakside.io/four/hello.txt"));
        routeInfo = rootRoute.routeInfoForRequest(request);
        TKAssertNotNull(routeInfo);
        context = routeInfo.route.contextWithMatches(routeInfo.matches);
        TKAssertNotNull(context);
        TKAssertEquals(context.file.length, 1);
        TKAssertEquals(context.file[0], "hello.txt");
        TKAssert(context.isKindOfClass(SKHTTPRouteTestsFourContext));
        responder = routeInfo.route.responderWithRequest(request, context);
        TKAssertNotNull(responder);
        TKAssert(responder.isKindOfClass(SKHTTPRouteTestsFourResponder));

        request = SKHTTPRequest.initWithMethodAndURL("GET", JSURL.initWithString("http://breakside.io/four/there.pdf"));
        routeInfo = rootRoute.routeInfoForRequest(request);
        TKAssertNotNull(routeInfo);
        context = routeInfo.route.contextWithMatches(routeInfo.matches);
        TKAssertNotNull(context);
        TKAssertEquals(context.file.length, 1);
        TKAssertEquals(context.file[0], "there.pdf");
        TKAssert(context.isKindOfClass(SKHTTPRouteTestsFourContext));
        responder = routeInfo.route.responderWithRequest(request, context);
        TKAssertNotNull(responder);
        TKAssert(responder.isKindOfClass(SKHTTPRouteTestsFourResponder));

        request = SKHTTPRequest.initWithMethodAndURL("GET", JSURL.initWithString("http://breakside.io/four/hello/there.txt"));
        routeInfo = rootRoute.routeInfoForRequest(request);
        TKAssertNotNull(routeInfo);
        context = routeInfo.route.contextWithMatches(routeInfo.matches);
        TKAssertNotNull(context);
        TKAssertEquals(context.file.length, 2);
        TKAssertEquals(context.file[0], "hello");
        TKAssertEquals(context.file[1], "there.txt");
        TKAssert(context.isKindOfClass(SKHTTPRouteTestsFourContext));
        responder = routeInfo.route.responderWithRequest(request, context);
        TKAssertNotNull(responder);
        TKAssert(responder.isKindOfClass(SKHTTPRouteTestsFourResponder));

        request = SKHTTPRequest.initWithMethodAndURL("GET", JSURL.initWithString("http://breakside.io//hello/there"));
        routeInfo = rootRoute.routeInfoForRequest(request);
        TKAssertNull(routeInfo);
    },

    testPathComponentsForResponder: function(){
        var routes = {
            "/":            "SKHTTPRouteTestsRootResponder",
            "/one":         "SKHTTPRouteTestsOneResponder",
            "/one/a":       "SKHTTPRouteTestsOneAResponder",
            "/two/*id/*name/test/**final": "SKHTTPRouteTestsTwoResponder",
            "/three/*id":   "SKHTTPRouteTestsThreeResponder",
            "/three/*id/x": "SKHTTPRouteTestsThreeXResponder",
            "/four/**file": "SKHTTPRouteTestsFourResponder",
        };
        var rootRoute = SKHTTPRoute.CreateFromMap(routes);
        var otherRoute = rootRoute.children[0].children[0];
        var components = rootRoute.pathComponentsForResponder(SKHTTPRouteTestsThreeResponder, {id: 'hello'});
        TKAssertArrayEquals(components, ["/", "three", "hello"]);
        var components2 = otherRoute.pathComponentsForResponder(SKHTTPRouteTestsThreeResponder, {id: 'hello'});
        TKAssertArrayEquals(components, ["/", "three", "hello"]);

        components = otherRoute.pathComponentsForResponder(SKHTTPRouteTestsFourResponder, {file: ["alpha", "beta", "test.txt"]});
        TKAssertArrayEquals(components, ["/", "four", "alpha", "beta", "test.txt"]);

        components = otherRoute.pathComponentsForResponder(SKHTTPRouteTestsTwoResponder, {id: 123, name: "testing", final: ["alpha", "bravo", "charlie"]});
        TKAssertArrayEquals(components, ["/", "two", "123", "testing", "test", "alpha", "bravo", "charlie"]);
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

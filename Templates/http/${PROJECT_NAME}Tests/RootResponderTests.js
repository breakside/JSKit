// #import ${PROJECT_NAME}
// #import TestKit
// #import ServerKitTesting
'use strict';

JSClass('RootResponderTests', TKTestSuite, {

    urlSession: null,
    server: null,

    setup: function(){
        // Create a mock URL session & server
        this.urlSession = SKMockURLSession.init();
        this.server = this.urlSession.server;

        // Configure the server with the same routes from Main.spec.yaml
        // (Alternatively, you could create routes by hand, but the spec
        // method helps test that the spec is written correctly)
        var mainSpec = JSSpec.initWithResource("Main");
        var serverSpecDictionary = mainSpec.unmodifiedValueForKey("HTTPServer");
        this.server.rootRoute = SKHTTPRoute.CreateFromMap(serverSpecDictionary.routes);

        // Since the tests don't involve AppDelegate, you may need to
        // set the server delegate to an object that does similar things
        this.server.delegate = {
            serverDidCreateContextForRequest: function(server, context, request){
                // configure the context as you would in AppDelegate
            }
        };
    },

    testGet: async function(){
        // For a mock URL session, the domain is unimportant unless your
        // server uses it in some way.  The default server does not, only
        // considering the path when figuring out which resonder to use.
        var url = JSURL.initWithString("http://test/");

        // Create a regular JSURLRequest and use the mock url session
        var request = JSURLRequest.initWithURL(url);
        var task = this.urlSession.dataTaskWithRequest(request);
        var response = await task.resume();

        // The response is a standard JSURLResponse
        TKAssertNotNull(response);
        TKAssertEquals(response.statusCode, 200);
        TKAssertEquals(response.contentType.mime, "application/json");
        var object = response.object;
        TKAssertNotNull(object);
        TKAssertEquals(object.message, "Hello, world!");
    }

});
// #import "Foundation/Foundation.js"
// #import "TestKit/TestKit.js"
/* global JSClass, JSData, TKTestSuite, TKAssert, TKAssertNull, TKAssertNotNull, TKAssertEquals, TKAssertExactEquals, TKAssertObjectEquals, JSURL */
'use strict';

JSClass('JSURLTests', TKTestSuite, {

    testStringConstructor: function(){
        var urlString = "http://google.com";
        var url = JSURL.initWithString(urlString);
        TKAssertNotNull(url);
    },

    testNonASCIIStringConstructor: function(){
        var urlString = "http://google.com/tèst";
        var url = JSURL.initWithString(urlString);
        TKAssertNull(url);
    },

    testDataConstructor: function(){
        var urlString = "http://google.com";
        var url = JSURL.initWithData(urlString.utf8());
        TKAssertNotNull(url);
    },

    testNonASCIIDataConstructor: function(){
        var urlString = "http://google.com/tèst";
        var url = JSURL.initWithData(urlString.utf8());
        TKAssertNull(url);
    },

    testParseScheme: function(){
        var url = JSURL.initWithString("http://google.com");
        TKAssertExactEquals(url.scheme, "http");
        url = JSURL.initWithString("http+test://google.com");
        TKAssertExactEquals(url.scheme, "http+test");
        url = JSURL.initWithString("http.test://google.com");
        TKAssertExactEquals(url.scheme, "http.test");
        url = JSURL.initWithString("http-test://google.com");
        TKAssertExactEquals(url.scheme, "http-test");
        url = JSURL.initWithString("http1://google.com");
        TKAssertExactEquals(url.scheme, "http1");
        url = JSURL.initWithString("1http://google.com");
        TKAssertExactEquals(url.scheme, "1http");
        url = JSURL.initWithString("abc:def");
        TKAssertExactEquals(url.scheme, "abc");
        url = JSURL.initWithString("abc:def:ghi");
        TKAssertExactEquals(url.scheme, "abc");
        url = JSURL.initWithString("abc");
        TKAssertNull(url.scheme);
    },

    testParseHost: function(){
        var url = JSURL.initWithString("http://google.com");
        TKAssertExactEquals(url.host, "google.com");
    },

    testParseUserInfo: function(){
        var url = JSURL.initWithString("http://owen@google.com");
        TKAssertExactEquals(url.scheme, "http");
        TKAssertExactEquals(url.host, "google.com");
        TKAssertExactEquals(String.initWithData(url.encodedUserInfo.dataByDecodingPercentEscapes(), String.Encoding.utf8), "owen");
        url = JSURL.initWithString("http://owen:pass@google.com");
        TKAssertExactEquals(url.scheme, "http");
        TKAssertExactEquals(url.host, "google.com");
        TKAssertExactEquals(String.initWithData(url.encodedUserInfo.dataByDecodingPercentEscapes(), String.Encoding.utf8), "owen:pass");
        url = JSURL.initWithString("http://ow%2Fen:pass@google.com");
        TKAssertExactEquals(url.scheme, "http");
        TKAssertExactEquals(url.host, "google.com");
        TKAssertExactEquals(String.initWithData(url.encodedUserInfo.dataByDecodingPercentEscapes(), String.Encoding.utf8), "ow/en:pass");
    },

    testParsePort: function(){
        var url = JSURL.initWithString("http://google.com");
        TKAssertExactEquals(url.scheme, "http");
        TKAssertExactEquals(url.host, "google.com");
        TKAssertNull(url.port);
        url = JSURL.initWithString("http://google.com:123");
        TKAssertExactEquals(url.scheme, "http");
        TKAssertExactEquals(url.host, "google.com");
        TKAssertExactEquals(url.port, 123);
        url = JSURL.initWithString("http://owen@google.com:123");
        TKAssertExactEquals(url.scheme, "http");
        TKAssertExactEquals(String.initWithData(url.encodedUserInfo.dataByDecodingPercentEscapes(), String.Encoding.utf8), "owen");
        TKAssertExactEquals(url.host, "google.com");
        TKAssertExactEquals(url.port, 123);
        url = JSURL.initWithString("http://google.com:abc");
        TKAssertExactEquals(url.scheme, "http");
        TKAssertExactEquals(url.host, "google.com");
        TKAssertNull(url.port);
    },

    testParsePath: function(){
        var url = JSURL.initWithString("http://google.com/");
        TKAssertExactEquals(url.scheme, "http");
        TKAssertExactEquals(url.host, "google.com");
        TKAssertExactEquals(url.pathComponents.length, 1);
        TKAssertExactEquals(url.pathComponents[0], '/');
        TKAssertExactEquals(url.path, "/");
        url = JSURL.initWithString("http://google.com/test");
        TKAssertExactEquals(url.scheme, "http");
        TKAssertExactEquals(url.host, "google.com");
        TKAssertExactEquals(url.pathComponents.length, 2);
        TKAssertExactEquals(url.pathComponents[0], '/');
        TKAssertExactEquals(url.pathComponents[1], 'test');
        TKAssertExactEquals(url.path, "/test");
        url = JSURL.initWithString("http://google.com/test/");
        TKAssertExactEquals(url.scheme, "http");
        TKAssertExactEquals(url.host, "google.com");
        TKAssertExactEquals(url.pathComponents.length, 2);
        TKAssertExactEquals(url.pathComponents[0], '/');
        TKAssertExactEquals(url.pathComponents[1], 'test');
        TKAssertExactEquals(url.path, "/test/");
        url = JSURL.initWithString("http://google.com/test/two");
        TKAssertExactEquals(url.scheme, "http");
        TKAssertExactEquals(url.host, "google.com");
        TKAssertExactEquals(url.pathComponents.length, 3);
        TKAssertExactEquals(url.pathComponents[0], '/');
        TKAssertExactEquals(url.pathComponents[1], 'test');
        TKAssertExactEquals(url.pathComponents[2], 'two');
        TKAssertExactEquals(url.path, "/test/two");
        url = JSURL.initWithString("abc:def");
        TKAssertExactEquals(url.scheme, "abc");
        TKAssertNull(url.host);
        TKAssertExactEquals(url.pathComponents.length, 1);
        TKAssertExactEquals(url.pathComponents[0], 'def');
        TKAssertExactEquals(url.path, "def");
    },

    testLastPathComponent: function(){
        var url = JSURL.initWithString("http://google.com");
        TKAssertNull(url.lastPathComponent, "/");
        url = JSURL.initWithString("http://google.com/");
        TKAssertExactEquals(url.lastPathComponent, "/");
        url = JSURL.initWithString("http://google.com/test");
        TKAssertExactEquals(url.lastPathComponent, "test");
        url = JSURL.initWithString("http://google.com/test/");
        TKAssertExactEquals(url.lastPathComponent, "test");
        url = JSURL.initWithString("http://google.com/test/two");
        TKAssertExactEquals(url.lastPathComponent, "two");
        url = JSURL.initWithString("abc:def");
        TKAssertExactEquals(url.lastPathComponent, "def");
    },

    testParsePathAdjustments: function(){
        var url = JSURL.initWithString("http://google.com/test//two/.././three");
        TKAssertExactEquals(url.scheme, 'http');
        TKAssertExactEquals(url.host, 'google.com');
        TKAssertExactEquals(url.pathComponents.length, 3);
        TKAssertExactEquals(url.pathComponents[0], '/');
        TKAssertExactEquals(url.pathComponents[1], 'test');
        TKAssertExactEquals(url.pathComponents[2], 'three');
        TKAssertExactEquals(url.path, '/test/three');
        url = JSURL.initWithString("http://google.com/test//two/../../../../../three");
        TKAssertExactEquals(url.scheme, 'http');
        TKAssertExactEquals(url.host, 'google.com');
        TKAssertExactEquals(url.pathComponents.length, 2);
        TKAssertExactEquals(url.pathComponents[0], '/');
        TKAssertExactEquals(url.pathComponents[1], 'three');
        TKAssertExactEquals(url.path, '/three');

        url = JSURL.initWithString("../../testing/.//one/two");
        TKAssert(!url.isAbsolute);
        TKAssertEquals(url.pathComponents.length, 5);
        TKAssertEquals(url.pathComponents[0], '..');
        TKAssertEquals(url.pathComponents[1], '..');
        TKAssertEquals(url.pathComponents[2], 'testing');
        TKAssertEquals(url.pathComponents[3], 'one');
        TKAssertEquals(url.pathComponents[4], 'two');

        url = JSURL.initWithString("../../testing/.//one/../two");
        TKAssert(!url.isAbsolute);
        TKAssertEquals(url.pathComponents.length, 4);
        TKAssertEquals(url.pathComponents[0], '..');
        TKAssertEquals(url.pathComponents[1], '..');
        TKAssertEquals(url.pathComponents[2], 'testing');
        TKAssertEquals(url.pathComponents[3], 'two');

        url = JSURL.initWithString("blob:http://localhost/id");
        TKAssert(!url.isAbsolute);
        TKAssertEquals(url.path, "http://localhost/id");
    },

    testParseQuery: function(){
        var url = JSURL.initWithString("http://google.com");
        var query;
        TKAssertExactEquals(url.scheme, 'http');
        TKAssertExactEquals(url.host, 'google.com');
        TKAssertNull(url.encodedQuery);
        TKAssertNotNull(url.query);
        TKAssertExactEquals(url.query.fields.length, 0);
        url = JSURL.initWithString("http://google.com?");
        TKAssertExactEquals(url.scheme, 'http');
        TKAssertExactEquals(url.host, 'google.com');
        TKAssertExactEquals(url.encodedQuery.length, 0);
        TKAssertExactEquals(url.query.fields.length, 0);
        url = JSURL.initWithString("http://google.com?a=1");
        TKAssertExactEquals(url.scheme, 'http');
        TKAssertExactEquals(url.host, 'google.com');
        TKAssertExactEquals(String.initWithData(url.encodedQuery, String.Encoding.utf8), "a=1");
        query = url.query;
        TKAssertExactEquals(query.fields.length, 1);
        TKAssertExactEquals(query.get('a'), "1");
        url = JSURL.initWithString("http://google.com/with/a/pa%3Fth?a=1");
        TKAssertExactEquals(url.scheme, 'http');
        TKAssertExactEquals(url.host, 'google.com');
        TKAssertExactEquals(url.path, '/with/a/pa?th');
        TKAssertExactEquals(String.initWithData(url.encodedQuery, String.Encoding.utf8), "a=1");
        query = url.query;
        TKAssertExactEquals(query.fields.length, 1);
        TKAssertExactEquals(query.get('a'), "1");
    },

    testParseFragment: function(){
        var url = JSURL.initWithString("http://google.com");
        var query;
        TKAssertExactEquals(url.scheme, 'http');
        TKAssertExactEquals(url.host, 'google.com');
        TKAssertNull(url.encodedFragment);
        url = JSURL.initWithString("http://google.com#");
        TKAssertExactEquals(url.scheme, 'http');
        TKAssertExactEquals(url.host, 'google.com');
        TKAssertNotNull(url.encodedFragment);
        TKAssertEquals(url.encodedFragment.length, 0);
        url = JSURL.initWithString("http://google.com#frag");
        TKAssertExactEquals(url.scheme, 'http');
        TKAssertExactEquals(url.host, 'google.com');
        TKAssertEquals(url.encodedFragment.length, 4);
        TKAssertExactEquals(String.initWithData(url.encodedFragment, String.Encoding.utf8), "frag");
        url = JSURL.initWithString("http://google.com/with/path/?and&query=%231#frag");
        TKAssertExactEquals(url.scheme, 'http');
        TKAssertExactEquals(url.host, 'google.com');
        TKAssertExactEquals(url.path, '/with/path/');
        query = url.query;
        TKAssertEquals(query.fields.length, 2);
        TKAssertNull(query.get('and'));
        TKAssertExactEquals(query.get('query'), '#1');
        TKAssertEquals(url.encodedFragment.length, 4);
        TKAssertExactEquals(String.initWithData(url.encodedFragment, String.Encoding.utf8), "frag");
    },

    testIdentity: function(){
        var str = "http://google.com";
        var url = JSURL.initWithString(str);
        TKAssertExactEquals(str, url.encodedString);
        str = "http://owen:pass@google.com:123/path/to/here/?query=1#frag";
        url = JSURL.initWithString(str);
        TKAssertExactEquals(str, url.encodedString);
        str = "http://owen:pas%2Fs@google.com:123/pa%23th/to/here/?qu?ery=1#frag";
        url = JSURL.initWithString(str);
        TKAssertExactEquals(str, url.encodedString);
    },

    testCopy: function(){
        var url = JSURL.initWithString("http://google.com");
        var copy = url.copy();
        TKAssertEquals(url.encodedString, copy.encodedString);

        url = JSURL.initWithString("http://google.com/some/path");
        copy = url.copy();
        TKAssertEquals(url.encodedString, copy.encodedString);

        url = JSURL.initWithString("http://google.com/some/path?with=query&more");
        copy = url.copy();
        TKAssertEquals(url.encodedString, copy.encodedString);

        url = JSURL.initWithString("http://google.com/some/path?with=query&more#fragment");
        copy = url.copy();
        TKAssertEquals(url.encodedString, copy.encodedString);
    },

    testSetPath: function(){
        var str = "file:///test/path";
        var url = JSURL.initWithString(str);
        url.setPath("/one/two");
        TKAssertExactEquals(url.encodedString, "file:///one/two");

        url.setPath("a");
        TKAssertExactEquals(url.encodedString, "file:///a");

        url.setPath("/a");
        TKAssertExactEquals(url.encodedString, "file:///a");

        url.setPath("a/b");
        TKAssertExactEquals(url.encodedString, "file:///a/b");

        url.setPath("/a/b");
        TKAssertExactEquals(url.encodedString, "file:///a/b");

        url.setPath("/with/trailing/slash/");
        TKAssertExactEquals(url.encodedString, "file:///with/trailing/slash/");

        url.setPath("");
        TKAssertExactEquals(url.encodedString, "file://");

        url.setPath("/");
        TKAssertExactEquals(url.encodedString, "file:///");

        url.setPath("//");
        TKAssertExactEquals(url.encodedString, "file:///");

        // no such thing a relative url that has a scheme and authority, will still be absolute
        url.setPath("relative");
        TKAssertExactEquals(url.encodedString, "file:///relative");

        url.setPath("/absolute");
        TKAssertExactEquals(url.encodedString, "file:///absolute");

        url.setPath("../../relative");
        TKAssertExactEquals(url.encodedString, "file:///relative");

        url.setPath("/../../../../../absolute");
        TKAssertExactEquals(url.encodedString, "file:///absolute");

        url.setPath("/one/../two/three/../../four");
        TKAssertExactEquals(url.encodedString, "file:///four");

        url.setPath("one/../two/../../four");
        TKAssertExactEquals(url.encodedString, "file:///four");

        // test relative url path behavior
        url = JSURL.initWithString("test/path");

        url.setPath("a/b");
        TKAssertExactEquals(url.encodedString, "a/b");

        url.setPath("/a/b");
        TKAssertExactEquals(url.encodedString, "/a/b");

        url.setPath("../../relative");
        TKAssertExactEquals(url.encodedString, "../../relative");

        url.setPath("one/../two/../../four");
        TKAssertExactEquals(url.encodedString, "../four");

        url.setPath("/one/../two/../../four");
        TKAssertExactEquals(url.encodedString, "/four");
    },

    testSetPathComponents: function(){
        var str = "file:///test/path";
        var url = JSURL.initWithString(str);
        url.setPathComponents(["/", "one", "two"]);
        TKAssertExactEquals(url.encodedString, "file:///one/two");

        url.setPathComponents(["a", "b"]);
        TKAssertExactEquals(url.encodedString, "file:///a/b");

        url.setPathComponents(["/", "other", "path"]);
        TKAssertExactEquals(url.encodedString, "file:///other/path");

        url.setPathComponents([]);
        TKAssertExactEquals(url.encodedString, "file:///");

        url.setPathComponents([""]);
        TKAssertExactEquals(url.encodedString, "file:///");

        url.setPathComponents(["", ""]);
        TKAssertExactEquals(url.encodedString, "file:///");

        url.setPathComponents(["", "/"]);
        TKAssertExactEquals(url.encodedString, "file:///");

        url.setPathComponents(["/"]);
        TKAssertExactEquals(url.encodedString, "file:///");

        url.setPathComponents(["/", "/"]);
        TKAssertExactEquals(url.encodedString, "file:///");

        url.setPathComponents(["."]);
        TKAssertExactEquals(url.encodedString, "file:///");

        url.setPathComponents([".", "."]);
        TKAssertExactEquals(url.encodedString, "file:///");

        url.setPathComponents(["/", "."]);
        TKAssertExactEquals(url.encodedString, "file:///");

        url.setPathComponents([".", "/"]);
        TKAssertExactEquals(url.encodedString, "file:///");

        url.setPathComponents(["..", "relative"]);
        TKAssertExactEquals(url.encodedString, "file:///relative");

        url.setPathComponents(["/", "..", "test"]);
        TKAssertExactEquals(url.encodedString, "file:///test");

        url.setPathComponents(["/", "..", "test", "..", ".", "", "..", "two", "..", "..", "..", "three"]);
        TKAssertExactEquals(url.encodedString, "file:///three");

        url.setPathComponents(["/","one","..","two","three","..","..","four"]);
        TKAssertExactEquals(url.encodedString, "file:///four");

        url.setPathComponents(["one","..","two","..","..","four"]);
        TKAssertExactEquals(url.encodedString, "file:///four");

        url.setPathComponents(["//testing/one/two", "three/four", "five"]);
        TKAssertExactEquals(url.encodedString, "file:///testing/one/two/three/four/five");

        url = JSURL.initWithString("test/path");

        url.setPathComponents(["a/b"]);
        TKAssertExactEquals(url.encodedString, "a/b");

        url.setPathComponents([""]);
        TKAssertExactEquals(url.encodedString, "");

        url.setPathComponents(["."]);
        TKAssertExactEquals(url.encodedString, "");

        url.setPathComponents(["/"]);
        TKAssertExactEquals(url.encodedString, "/");

        url.setPathComponents(["/", "/"]);
        TKAssertExactEquals(url.encodedString, "/");

        url.setPathComponents(["", ""]);
        TKAssertExactEquals(url.encodedString, "");

        url.setPathComponents(["", "."]);
        TKAssertExactEquals(url.encodedString, "");

        url.setPathComponents([".", ""]);
        TKAssertExactEquals(url.encodedString, "");

        url.setPathComponents([".", "/"]);
        TKAssertExactEquals(url.encodedString, "");

        url.setPathComponents(["/", "."]);
        TKAssertExactEquals(url.encodedString, "/");

        url.setPathComponents(["one", "..", "two"]);
        TKAssertExactEquals(url.encodedString, "two");

        url.setPathComponents(["one", "..", "two", "three", "..", "..", "..", "four"]);
        TKAssertExactEquals(url.encodedString, "../four");

        url.setPathComponents(["/", "one", "..", "two", "three", "..", "..", "..", "four"]);
        TKAssertExactEquals(url.encodedString, "/four");

    },

    testAppendPathComponents: function(){
        var url = JSURL.initWithString("file:///test");
        url.appendPathComponents(["a", "b"]);
        TKAssertExactEquals(url.encodedString, "file:///test/a/b");

        url = JSURL.initWithString("file:///test");
        url.appendPathComponents(["/", "a", "", ".", "b"]);
        TKAssertExactEquals(url.encodedString, "file:///test/a/b");

        url = JSURL.initWithString("file:///test");
        url.appendPathComponents(["a", "..", "..", "..", "b"]);
        TKAssertExactEquals(url.encodedString, "file:///b");

        url = JSURL.initWithString("test");
        url.appendPathComponents(["a", "..", "..", "..", "b"]);
        TKAssertExactEquals(url.encodedString, "../b");

        url = JSURL.initWithString("");
        url.appendPathComponents(["a", "b"]);
        TKAssertExactEquals(url.encodedString, "a/b");

        url = JSURL.initWithString("");
        url.appendPathComponents(["/", "a", "b"]);
        TKAssertExactEquals(url.encodedString, "/a/b");

        url = JSURL.initWithString("");
        url.appendPathComponents(["//a/b", "c/d", "e"]);
        TKAssertExactEquals(url.encodedString, "/a/b/c/d/e");
    },

    testAppendPathComponent: function(){
        var url = JSURL.initWithString("file:///test");
        url.appendPathComponent("a");
        TKAssertExactEquals(url.encodedString, "file:///test/a");

        url = JSURL.initWithString("file:///test");
        url.appendPathComponent("/");
        TKAssertExactEquals(url.encodedString, "file:///test");

        url = JSURL.initWithString("file:///test");
        url.appendPathComponent(".");
        TKAssertExactEquals(url.encodedString, "file:///test");

        url = JSURL.initWithString("file:///test");
        url.appendPathComponent("");
        TKAssertExactEquals(url.encodedString, "file:///test");

        url = JSURL.initWithString("file:///test");
        url.appendPathComponent("..");
        TKAssertExactEquals(url.encodedString, "file:///");

        url = JSURL.initWithString("test");
        url.appendPathComponent("..");
        TKAssertExactEquals(url.encodedString, "");

        url = JSURL.initWithString("");
        url.appendPathComponent("..");
        TKAssertExactEquals(url.encodedString, "..");

        url = JSURL.initWithString("");
        url.appendPathComponent("//testing/one/two");
        TKAssertExactEquals(url.encodedString, "/testing/one/two");
    },

    testRemoveLastPathComponent: function(){
        var url = JSURL.initWithString("file:///test/one/two/three.txt");
        url.removeLastPathComponent();
        TKAssertExactEquals(url.encodedString, "file:///test/one/two");

        url.removeLastPathComponent();
        TKAssertExactEquals(url.encodedString, "file:///test/one");

        url.removeLastPathComponent();
        TKAssertExactEquals(url.encodedString, "file:///test");

        url.removeLastPathComponent();
        TKAssertExactEquals(url.encodedString, "file:///");

        url.removeLastPathComponent();
        TKAssertExactEquals(url.encodedString, "file://");

        url = JSURL.initWithString("../../test/one");
        url.removeLastPathComponent();
        TKAssertExactEquals(url.encodedString, "../../test");
        url.removeLastPathComponent();
        TKAssertExactEquals(url.encodedString, "../..");
        url.removeLastPathComponent();
        TKAssertExactEquals(url.encodedString, "..");
        url.removeLastPathComponent();
        TKAssertExactEquals(url.encodedString, "");
    }

    // TODO: test modifying parts other than path

});
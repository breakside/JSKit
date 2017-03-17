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

    // TODO: test relative URLs
    // TODO: test modifying URL

});
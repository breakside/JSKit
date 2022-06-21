// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #import Foundation
// #import TestKit
'use strict';

JSClass('JSURLTests', TKTestSuite, {

    testStringConstructor: function(){
        var urlString = "http://google.com";
        var url = JSURL.initWithString(urlString);
        TKAssertNotNull(url);

        urlString = null;
        url = JSURL.initWithString(urlString);
        TKAssertNull(url);

        urlString = undefined;
        url = JSURL.initWithString(urlString);
        TKAssertNull(url);
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

        var data = null;
        url = JSURL.initWithString(data);
        TKAssertNull(url);

        data = undefined;
        url = JSURL.initWithString(data);
        TKAssertNull(url);
    },

    testNonASCIIDataConstructor: function(){
        var urlString = "http://google.com/tèst";
        var url = JSURL.initWithData(urlString.utf8());
        TKAssertNull(url);
    },

    testInitWithBaseURL: function(){
        var base = JSURL.initWithString("http://google.com/some/path");
        var url = JSURL.initWithString("/absolute/path", base);
        TKAssertEquals(url.encodedString, "http://google.com/absolute/path");

        url = JSURL.initWithString("relative/path", base);
        TKAssertEquals(url.encodedString, "http://google.com/some/relative/path");

        url = JSURL.initWithString("./relative/path", base);
        TKAssertEquals(url.encodedString, "http://google.com/some/relative/path");

        url = JSURL.initWithString("../relative/path", base);
        TKAssertEquals(url.encodedString, "http://google.com/relative/path");

        url = JSURL.initWithString("../../relative/path", base);
        TKAssertEquals(url.encodedString, "http://google.com/relative/path");

        url = JSURL.initWithString("../../../relative/path", base);
        TKAssertEquals(url.encodedString, "http://google.com/relative/path");

        // Trailing / on base
        base = JSURL.initWithString("http://google.com/some/path/");
        url = JSURL.initWithString("/absolute/path", base);
        TKAssertEquals(url.encodedString, "http://google.com/absolute/path");

        url = JSURL.initWithString("relative/path", base);
        TKAssertEquals(url.encodedString, "http://google.com/some/path/relative/path");

        url = JSURL.initWithString("./relative/path", base);
        TKAssertEquals(url.encodedString, "http://google.com/some/path/relative/path");

        url = JSURL.initWithString("../relative/path", base);
        TKAssertEquals(url.encodedString, "http://google.com/some/relative/path");

        url = JSURL.initWithString("../../relative/path", base);
        TKAssertEquals(url.encodedString, "http://google.com/relative/path");

        url = JSURL.initWithString("../../../relative/path", base);
        TKAssertEquals(url.encodedString, "http://google.com/relative/path");

        // No path (not even /)
        base = JSURL.initWithString("http://google.com");
        url = JSURL.initWithString("/absolute/path", base);
        TKAssertEquals(url.encodedString, "http://google.com/absolute/path");

        url = JSURL.initWithString("relative/path", base);
        TKAssertEquals(url.encodedString, "http://google.com/relative/path");

        url = JSURL.initWithString("./relative/path", base);
        TKAssertEquals(url.encodedString, "http://google.com/relative/path");

        url = JSURL.initWithString("../relative/path", base);
        TKAssertEquals(url.encodedString, "http://google.com/relative/path");

        url = JSURL.initWithString("../../relative/path", base);
        TKAssertEquals(url.encodedString, "http://google.com/relative/path");

        url = JSURL.initWithString("../../../relative/path", base);
        TKAssertEquals(url.encodedString, "http://google.com/relative/path");

        url = JSURL.initWithString("", base);
        TKAssertEquals(url.encodedString, "http://google.com");

        // Root path (just /)
        base = JSURL.initWithString("http://google.com/");
        url = JSURL.initWithString("/absolute/path", base);
        TKAssertEquals(url.encodedString, "http://google.com/absolute/path");

        url = JSURL.initWithString("relative/path", base);
        TKAssertEquals(url.encodedString, "http://google.com/relative/path");

        url = JSURL.initWithString("./relative/path", base);
        TKAssertEquals(url.encodedString, "http://google.com/relative/path");

        url = JSURL.initWithString("../relative/path", base);
        TKAssertEquals(url.encodedString, "http://google.com/relative/path");

        url = JSURL.initWithString("../../relative/path", base);
        TKAssertEquals(url.encodedString, "http://google.com/relative/path");

        url = JSURL.initWithString("../../../relative/path", base);
        TKAssertEquals(url.encodedString, "http://google.com/relative/path");

        url = JSURL.initWithString("", base);
        TKAssertEquals(url.encodedString, "http://google.com/");

        // Scheme
        base = JSURL.initWithString("http://google.com/some/path");
        url = JSURL.initWithString("//yahoo.com/a/b", base);
        TKAssertEquals(url.encodedString, "http://yahoo.com/a/b");

        base = JSURL.initWithString("https://google.com/some/path");
        url = JSURL.initWithString("//yahoo.com/a/b", base);
        TKAssertEquals(url.encodedString, "https://yahoo.com/a/b");

        // Trailing slash
        base = JSURL.initWithString("http://google.com/some/path/");
        url = JSURL.initWithString("a", base);
        TKAssertEquals(url.encodedString, "http://google.com/some/path/a");

        base = JSURL.initWithString("http://google.com/some/path/");
        url = JSURL.initWithString("a/", base);
        TKAssertEquals(url.encodedString, "http://google.com/some/path/a/");

        base = JSURL.initWithString("http://google.com/some/path");
        url = JSURL.initWithString("a", base);
        TKAssertEquals(url.encodedString, "http://google.com/some/a");

        base = JSURL.initWithString("http://google.com/some/path");
        url = JSURL.initWithString("a/", base);
        TKAssertEquals(url.encodedString, "http://google.com/some/a/");

        // Query
        base = JSURL.initWithString("http://google.com/some/path");
        url = JSURL.initWithString("?one=1&two=2", base);
        TKAssertEquals(url.encodedString, "http://google.com/some/path?one=1&two=2");

        base = JSURL.initWithString("http://google.com/some/path#frag");
        url = JSURL.initWithString("?one=1&two=2", base);
        TKAssertEquals(url.encodedString, "http://google.com/some/path?one=1&two=2");

        base = JSURL.initWithString("http://google.com/some/path?a=b");
        url = JSURL.initWithString("?one=1&two=2", base);
        TKAssertEquals(url.encodedString, "http://google.com/some/path?one=1&two=2");

        base = JSURL.initWithString("http://google.com/some/path?a=b");
        url = JSURL.initWithString("other", base);
        TKAssertEquals(url.encodedString, "http://google.com/some/other");

        base = JSURL.initWithString("http://google.com/some/path?a=b");
        url = JSURL.initWithString("other?one=1&two=2", base);
        TKAssertEquals(url.encodedString, "http://google.com/some/other?one=1&two=2");

        base = JSURL.initWithString("http://google.com/some/path?a=b#frag");
        url = JSURL.initWithString("?one=1&two=2", base);
        TKAssertEquals(url.encodedString, "http://google.com/some/path?one=1&two=2");

        // Fragment
        base = JSURL.initWithString("http://google.com/some/path#somewhere");
        url = JSURL.initWithString("other", base);
        TKAssertEquals(url.encodedString, "http://google.com/some/other");

        base = JSURL.initWithString("http://google.com/some/path?query=1#somewhere");
        url = JSURL.initWithString("other", base);
        TKAssertEquals(url.encodedString, "http://google.com/some/other");

        base = JSURL.initWithString("http://google.com/some/path#somewhere");
        url = JSURL.initWithString("?query=1", base);
        TKAssertEquals(url.encodedString, "http://google.com/some/path?query=1");

        base = JSURL.initWithString("http://google.com/some/path#somewhere");
        url = JSURL.initWithString("?query=1#frag", base);
        TKAssertEquals(url.encodedString, "http://google.com/some/path?query=1#frag");

        base = JSURL.initWithString("http://google.com/some/path#somewhere");
        url = JSURL.initWithString("#frag", base);
        TKAssertEquals(url.encodedString, "http://google.com/some/path#frag");

        base = JSURL.initWithString("http://google.com/some/path");
        url = JSURL.initWithString("#frag", base);
        TKAssertEquals(url.encodedString, "http://google.com/some/path#frag");

        base = JSURL.initWithString("http://google.com/some/path?query=1");
        url = JSURL.initWithString("#frag", base);
        TKAssertEquals(url.encodedString, "http://google.com/some/path?query=1#frag");
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
        url = JSURL.initWithString("http://google.com/test//two");
        TKAssertExactEquals(url.scheme, "http");
        TKAssertExactEquals(url.host, "google.com");
        TKAssertExactEquals(url.pathComponents.length, 3);
        TKAssertExactEquals(url.pathComponents[0], '/');
        TKAssertExactEquals(url.pathComponents[1], 'test');
        TKAssertExactEquals(url.pathComponents[2], 'two');
        TKAssertExactEquals(url.path, "/test//two");
        url = JSURL.initWithString("abc:def");
        TKAssertExactEquals(url.scheme, "abc");
        TKAssertNull(url.host);
        TKAssertExactEquals(url.pathComponents.length, 1);
        TKAssertExactEquals(url.pathComponents[0], 'def');
        TKAssertExactEquals(url.path, "def");

        url = JSURL.initWithString("/test");
        TKAssertNull(url.scheme);
        TKAssertNull(url.host);
        TKAssertExactEquals(url.pathComponents.length, 2);
        TKAssertExactEquals(url.pathComponents[0], '/');
        TKAssertExactEquals(url.pathComponents[1], 'test');
        TKAssertExactEquals(url.path, "/test");

        url = JSURL.initWithString("//test");
        TKAssertNull(url.scheme);
        TKAssertExactEquals(url.host, 'test');
        TKAssertExactEquals(url.pathComponents.length, 0);
        TKAssertExactEquals(url.path, "");
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

    testStandardize: function(){
        var url = JSURL.initWithString("http://google.com/test//two/.././three");
        TKAssertExactEquals(url.scheme, 'http');
        TKAssertExactEquals(url.host, 'google.com');
        TKAssertExactEquals(url.path, "/test//two/.././three");
        TKAssertExactEquals(url.pathComponents.length, 6);
        TKAssertExactEquals(url.pathComponents[0], '/');
        TKAssertExactEquals(url.pathComponents[1], 'test');
        TKAssertExactEquals(url.pathComponents[2], 'two');
        TKAssertExactEquals(url.pathComponents[3], '..');
        TKAssertExactEquals(url.pathComponents[4], '.');
        TKAssertExactEquals(url.pathComponents[5], 'three');
        url.standardize();
        TKAssertExactEquals(url.path, '/test/three');
        TKAssertExactEquals(url.pathComponents.length, 3);
        TKAssertExactEquals(url.pathComponents[0], '/');
        TKAssertExactEquals(url.pathComponents[1], 'test');
        TKAssertExactEquals(url.pathComponents[2], 'three');

        url = JSURL.initWithString("http://google.com/test//two/../../../../../three");
        TKAssertExactEquals(url.scheme, 'http');
        TKAssertExactEquals(url.host, 'google.com');
        TKAssertExactEquals(url.path, "/test//two/../../../../../three");
        TKAssertExactEquals(url.pathComponents.length, 9);
        TKAssertExactEquals(url.pathComponents[0], '/');
        TKAssertExactEquals(url.pathComponents[1], 'test');
        TKAssertExactEquals(url.pathComponents[2], 'two');
        TKAssertExactEquals(url.pathComponents[3], '..');
        TKAssertExactEquals(url.pathComponents[4], '..');
        TKAssertExactEquals(url.pathComponents[5], '..');
        TKAssertExactEquals(url.pathComponents[6], '..');
        TKAssertExactEquals(url.pathComponents[7], '..');
        TKAssertExactEquals(url.pathComponents[8], 'three');
        url.standardize();
        TKAssertExactEquals(url.path, '/three');
        TKAssertExactEquals(url.pathComponents.length, 2);
        TKAssertExactEquals(url.pathComponents[0], '/');
        TKAssertExactEquals(url.pathComponents[1], 'three');

        url = JSURL.initWithString("../../testing/.//one/two");
        TKAssert(!url.isAbsolute);
        TKAssertExactEquals(url.path, '../../testing/.//one/two');
        TKAssertEquals(url.pathComponents.length, 6);
        TKAssertEquals(url.pathComponents[0], '..');
        TKAssertEquals(url.pathComponents[1], '..');
        TKAssertEquals(url.pathComponents[2], 'testing');
        TKAssertEquals(url.pathComponents[3], '.');
        TKAssertEquals(url.pathComponents[4], 'one');
        TKAssertEquals(url.pathComponents[5], 'two');
        url.standardize();
        TKAssertExactEquals(url.path, '../../testing/one/two');
        TKAssertEquals(url.pathComponents.length, 5);
        TKAssertEquals(url.pathComponents[0], '..');
        TKAssertEquals(url.pathComponents[1], '..');
        TKAssertEquals(url.pathComponents[2], 'testing');
        TKAssertEquals(url.pathComponents[3], 'one');
        TKAssertEquals(url.pathComponents[4], 'two');

        url = JSURL.initWithString("../../testing/.//one/../two");
        TKAssert(!url.isAbsolute);
        TKAssertExactEquals(url.path, '../../testing/.//one/../two');
        TKAssertEquals(url.pathComponents.length, 7);
        TKAssertEquals(url.pathComponents[0], '..');
        TKAssertEquals(url.pathComponents[1], '..');
        TKAssertEquals(url.pathComponents[2], 'testing');
        TKAssertEquals(url.pathComponents[3], '.');
        TKAssertEquals(url.pathComponents[4], 'one');
        TKAssertEquals(url.pathComponents[5], '..');
        TKAssertEquals(url.pathComponents[6], 'two');
        url.standardize();
        TKAssertExactEquals(url.path, '../../testing/two');
        TKAssertEquals(url.pathComponents.length, 4);
        TKAssertEquals(url.pathComponents[0], '..');
        TKAssertEquals(url.pathComponents[1], '..');
        TKAssertEquals(url.pathComponents[2], 'testing');
        TKAssertEquals(url.pathComponents[3], 'two');

        url = JSURL.initWithString("../../../testing/../../one/../two");
        url.standardize();
        TKAssertEquals(url.path, '../../../../two');

        url = JSURL.initWithString("./../../../testing/../../one/../two");
        url.standardize();
        TKAssertEquals(url.path, '../../../../two');

        url = JSURL.initWithString("file:///path/to/folder/../one/two/");
        url.standardize();
        TKAssertEquals(url.encodedString, "file:///path/to/one/two/");

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
        TKAssertInstance(url.query, JSFormFieldMap);
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
        TKAssertInstance(query, JSFormFieldMap);
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
        url.path = "/one/two";
        TKAssertExactEquals(url.encodedString, "file:///one/two");

        url.path = "a";
        TKAssertExactEquals(url.encodedString, "file:///a");

        url.path = "/a";
        TKAssertExactEquals(url.encodedString, "file:///a");

        url.path = "a/b";
        TKAssertExactEquals(url.encodedString, "file:///a/b");

        url.path = "/a/b";
        TKAssertExactEquals(url.encodedString, "file:///a/b");

        url.path = "/with/trailing/slash/";
        TKAssertExactEquals(url.encodedString, "file:///with/trailing/slash/");

        url.path = "";
        TKAssertExactEquals(url.encodedString, "file://");

        url.path = "/";
        TKAssertExactEquals(url.encodedString, "file:///");

        url.path = "//";
        TKAssertExactEquals(url.encodedString, "file:////");

        // no such thing a relative url that has a scheme and authority, will still be absolute
        url.path = "relative";
        TKAssertExactEquals(url.encodedString, "file:///relative");

        url.path = "/absolute";
        TKAssertExactEquals(url.encodedString, "file:///absolute");

        url.path = "../../relative";
        TKAssertExactEquals(url.encodedString, "file:///../../relative");

        url.path = "/../../../../../absolute";
        TKAssertExactEquals(url.encodedString, "file:///../../../../../absolute");

        url.path = "/one/../two/three/../../four";
        TKAssertExactEquals(url.encodedString, "file:///one/../two/three/../../four");

        url.path = "one/../two/../../four";
        TKAssertExactEquals(url.encodedString, "file:///one/../two/../../four");

        // test relative url path behavior
        url = JSURL.initWithString("test/path");

        url.path = "a/b";
        TKAssertExactEquals(url.encodedString, "a/b");

        url.path = "/a/b";
        TKAssertExactEquals(url.encodedString, "/a/b");

        url.path = "../../relative";
        TKAssertExactEquals(url.encodedString, "../../relative");

        url.path = "one/../two/../../four";
        TKAssertExactEquals(url.encodedString, "one/../two/../../four");

        url.path = "/one/../two/../../four";
        TKAssertExactEquals(url.encodedString, "/one/../two/../../four");
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
        TKAssertExactEquals(url.encodedString, "file://");

        url.setPathComponents([""]);
        TKAssertExactEquals(url.encodedString, "file://");

        url.setPathComponents(["", ""]);
        TKAssertExactEquals(url.encodedString, "file://");

        url.setPathComponents(["", "/"]);
        TKAssertExactEquals(url.encodedString, "file://");

        url.setPathComponents(["/"]);
        TKAssertExactEquals(url.encodedString, "file:///");

        url.setPathComponents(["/", "/"]);
        TKAssertExactEquals(url.encodedString, "file:///");

        url.setPathComponents(["."]);
        TKAssertExactEquals(url.encodedString, "file:///.");

        url.setPathComponents([".", "."]);
        TKAssertExactEquals(url.encodedString, "file:///./.");

        url.setPathComponents(["/", "."]);
        TKAssertExactEquals(url.encodedString, "file:///.");

        url.setPathComponents([".", "/"]);
        TKAssertExactEquals(url.encodedString, "file:///./");

        url.setPathComponents(["..", "relative"]);
        TKAssertExactEquals(url.encodedString, "file:///../relative");

        url.setPathComponents(["/", "..", "test"]);
        TKAssertExactEquals(url.encodedString, "file:///../test");

        url.setPathComponents(["/", "..", "test", "..", ".", "", "..", "two", "..", "..", "..", "three"]);
        TKAssertExactEquals(url.encodedString, "file:///../test/.././../two/../../../three");

        url.setPathComponents(["/","one","..","two","three","..","..","four"]);
        TKAssertExactEquals(url.encodedString, "file:///one/../two/three/../../four");

        url.setPathComponents(["one","..","two","..","..","four"]);
        TKAssertExactEquals(url.encodedString, "file:///one/../two/../../four");

        url.setPathComponents(["//testing/one/two", "three/four", "five"]);
        TKAssertExactEquals(url.encodedString, "file:///testing/one/two/three/four/five");

        url = JSURL.initWithString("test/path");

        url.setPathComponents(["a/b"]);
        TKAssertExactEquals(url.encodedString, "a/b");

        url.setPathComponents([""]);
        TKAssertExactEquals(url.encodedString, "");

        url.setPathComponents(["."]);
        TKAssertExactEquals(url.encodedString, ".");

        url.setPathComponents(["/"]);
        TKAssertExactEquals(url.encodedString, "/");

        url.setPathComponents(["/", "/"]);
        TKAssertExactEquals(url.encodedString, "/");

        url.setPathComponents(["", ""]);
        TKAssertExactEquals(url.encodedString, "");

        url.setPathComponents(["", "."]);
        TKAssertExactEquals(url.encodedString, ".");

        url.setPathComponents([".", ""]);
        TKAssertExactEquals(url.encodedString, ".");

        url.setPathComponents([".", "/"]);
        TKAssertExactEquals(url.encodedString, "./");

        url.setPathComponents(["/", "."]);
        TKAssertExactEquals(url.encodedString, "/.");

        url.setPathComponents(["one", "..", "two"]);
        TKAssertExactEquals(url.encodedString, "one/../two");

        url.setPathComponents(["one", "..", "two", "three", "..", "..", "..", "four"]);
        TKAssertExactEquals(url.encodedString, "one/../two/three/../../../four");

        url.setPathComponents(["/", "one", "..", "two", "three", "..", "..", "..", "four"]);
        TKAssertExactEquals(url.encodedString, "/one/../two/three/../../../four");

    },

    testAppendPathComponents: function(){
        var url = JSURL.initWithString("file:///test");
        url.appendPathComponents(["a", "b"]);
        TKAssertExactEquals(url.encodedString, "file:///test/a/b");

        url.appendPathComponents(["c", "d"], true);
        TKAssertExactEquals(url.encodedString, "file:///test/a/b/c/d/");

        url = JSURL.initWithString("file:///test");
        url.appendPathComponents(["/", "a", "", ".", "b"]);
        TKAssertExactEquals(url.encodedString, "file:///test/a/./b");

        url = JSURL.initWithString("file:///test");
        url.appendPathComponents(["a", "..", "..", "..", "b"]);
        TKAssertExactEquals(url.encodedString, "file:///test/a/../../../b");

        url = JSURL.initWithString("test");
        url.appendPathComponents(["a", "..", "..", "..", "b"]);
        TKAssertExactEquals(url.encodedString, "test/a/../../../b");

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
        url.appendPathComponent("b", true);
        TKAssertExactEquals(url.encodedString, "file:///test/a/b/");

        url = JSURL.initWithString("file:///test");
        url.appendPathComponent("/");
        TKAssertExactEquals(url.encodedString, "file:///test/");

        url = JSURL.initWithString("file:///test");
        url.appendPathComponent(".");
        TKAssertExactEquals(url.encodedString, "file:///test/.");

        url = JSURL.initWithString("file:///test");
        url.appendPathComponent("");
        TKAssertExactEquals(url.encodedString, "file:///test");

        url = JSURL.initWithString("file:///test");
        url.appendPathComponent("..");
        TKAssertExactEquals(url.encodedString, "file:///test/..");

        url = JSURL.initWithString("test");
        url.appendPathComponent("..");
        TKAssertExactEquals(url.encodedString, "test/..");

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
        TKAssertExactEquals(url.encodedString, "file:///test/one/two/");

        url.removeLastPathComponent();
        TKAssertExactEquals(url.encodedString, "file:///test/one/");

        url.removeLastPathComponent();
        TKAssertExactEquals(url.encodedString, "file:///test/");

        url.removeLastPathComponent();
        TKAssertExactEquals(url.encodedString, "file:///");

        url.removeLastPathComponent();
        TKAssertExactEquals(url.encodedString, "file://");

        url = JSURL.initWithString("../../test/one");
        url.removeLastPathComponent();
        TKAssertExactEquals(url.encodedString, "../../test/");
        url.removeLastPathComponent();
        TKAssertExactEquals(url.encodedString, "../../");
        url.removeLastPathComponent();
        TKAssertExactEquals(url.encodedString, "../");
        url.removeLastPathComponent();
        TKAssertExactEquals(url.encodedString, "");
    },

    testFileExtension: function(){
        var url = JSURL.initWithString("http://google.com");
        var ext = url.fileExtension;
        TKAssertExactEquals(ext, '');

        url = JSURL.initWithString("http://google.com/");
        ext = url.fileExtension;
        TKAssertExactEquals(ext, '');

        url = JSURL.initWithString("http://google.com/test");
        ext = url.fileExtension;
        TKAssertExactEquals(ext, '');

        url = JSURL.initWithString("http://google.com/.test");
        ext = url.fileExtension;
        TKAssertExactEquals(ext, '');

        url = JSURL.initWithString("http://google.com/test.");
        ext = url.fileExtension;
        TKAssertExactEquals(ext, '.');

        url = JSURL.initWithString("http://google.com/test.a");
        ext = url.fileExtension;
        TKAssertExactEquals(ext, '.a');

        url = JSURL.initWithString("http://google.com/test.a.b");
        ext = url.fileExtension;
        TKAssertExactEquals(ext, '.b');

        url = JSURL.initWithString("http://google.com/test.a.reallylongext");
        ext = url.fileExtension;
        TKAssertExactEquals(ext, '.reallylongext');
    },

    testRemoveFileExtension: function(){
        var url = JSURL.initWithString("http://google.com");
        url.removeFileExtension();
        TKAssertExactEquals(url.encodedString, 'http://google.com');

        url = JSURL.initWithString("http://google.com/");
        url.removeFileExtension();
        TKAssertExactEquals(url.encodedString, 'http://google.com/');

        url = JSURL.initWithString("http://google.com/test");
        url.removeFileExtension();
        TKAssertExactEquals(url.encodedString, 'http://google.com/test');

        url = JSURL.initWithString("http://google.com/.test");
        url.removeFileExtension();
        TKAssertExactEquals(url.encodedString, 'http://google.com/.test');

        url = JSURL.initWithString("http://google.com/test.");
        url.removeFileExtension();
        TKAssertExactEquals(url.encodedString, 'http://google.com/test');

        url = JSURL.initWithString("http://google.com/test.a");
        url.removeFileExtension();
        TKAssertExactEquals(url.encodedString, 'http://google.com/test');

        url = JSURL.initWithString("http://google.com/test.a.b");
        url.removeFileExtension();
        TKAssertExactEquals(url.encodedString, 'http://google.com/test.a');

        url = JSURL.initWithString("http://google.com/test.a.reallylongext");
        url.removeFileExtension();
        TKAssertExactEquals(url.encodedString, 'http://google.com/test.a');
    },

    testEncodedStringRelativeTo: function(){
        var url = JSURL.initWithString("file:///one/two/three/four");
        var baseURL = JSURL.initWithString("file:///one/two/three");
        var relativeString = url.encodedStringRelativeTo(baseURL);
        TKAssertEquals(relativeString, "three/four");

        url = JSURL.initWithString("file:///one/two/three/four/");
        baseURL = JSURL.initWithString("file:///one/two/three/");
        relativeString = url.encodedStringRelativeTo(baseURL);
        TKAssertEquals(relativeString, "four/");

        url = JSURL.initWithString("file:///one/two/four");
        baseURL = JSURL.initWithString("file:///one/two/three/");
        relativeString = url.encodedStringRelativeTo(baseURL);
        TKAssertEquals(relativeString, "../four");

        url = JSURL.initWithString("file:///one/two/four");
        baseURL = JSURL.initWithString("file:///one/two/three");
        relativeString = url.encodedStringRelativeTo(baseURL);
        TKAssertEquals(relativeString, "four");

        url = JSURL.initWithString("file:///one/four");
        baseURL = JSURL.initWithString("file:///one/two/three/");
        relativeString = url.encodedStringRelativeTo(baseURL);
        TKAssertEquals(relativeString, "../../four");

        url = JSURL.initWithString("file:///one/four");
        baseURL = JSURL.initWithString("file:///one/two/three");
        relativeString = url.encodedStringRelativeTo(baseURL);
        TKAssertEquals(relativeString, "../four");

        url = JSURL.initWithString("file:///one/");
        baseURL = JSURL.initWithString("file:///one/two/three");
        relativeString = url.encodedStringRelativeTo(baseURL);
        TKAssertEquals(relativeString, "../");

        url = JSURL.initWithString("file:///one");
        baseURL = JSURL.initWithString("file:///one/two/three/");
        relativeString = url.encodedStringRelativeTo(baseURL);
        TKAssertEquals(relativeString, "../../../one");

        url = JSURL.initWithString("file:///one/four");
        baseURL = JSURL.initWithString("http://google.com");
        relativeString = url.encodedStringRelativeTo(baseURL);
        TKAssertEquals(relativeString, "file:///one/four");

        url = JSURL.initWithString("http://google.com/one/two/");
        baseURL = JSURL.initWithString("http://google.com/one/");
        relativeString = url.encodedStringRelativeTo(baseURL);
        TKAssertEquals(relativeString, "two/");

        url = JSURL.initWithString("http://google.com/one/four");
        baseURL = JSURL.initWithString("http://google.com/one/two/three/");
        relativeString = url.encodedStringRelativeTo(baseURL);
        TKAssertEquals(relativeString, "../../four");

        url = JSURL.initWithString("http://google.com/one/four");
        baseURL = JSURL.initWithString("http://yahoo.com/one/two/three/");
        relativeString = url.encodedStringRelativeTo(baseURL);
        TKAssertEquals(relativeString, "//google.com/one/four");

        url = JSURL.initWithString("http://google.com/one/two/");
        baseURL = JSURL.initWithString("http://google.com/one/two/three");
        relativeString = url.encodedStringRelativeTo(baseURL);
        TKAssertEquals(relativeString, "./");

        url = JSURL.initWithString("http://google.com/one/two");
        baseURL = JSURL.initWithString("http://google.com/one/two/three");
        relativeString = url.encodedStringRelativeTo(baseURL);
        TKAssertEquals(relativeString, "../two");

        url = JSURL.initWithString("http://google.com/one/two/");
        baseURL = JSURL.initWithString("http://google.com/one/two/three/four");
        relativeString = url.encodedStringRelativeTo(baseURL);
        TKAssertEquals(relativeString, "../");

        url = JSURL.initWithString("http://google.com/one/two");
        baseURL = JSURL.initWithString("http://google.com/one/two/three/four");
        relativeString = url.encodedStringRelativeTo(baseURL);
        TKAssertEquals(relativeString, "../../two");
    },

    testSetHost: function(){
        var url = JSURL.initWithString('/test/path');
        url.host = "google.com";
        TKAssertEquals(url.host, "google.com");
        TKAssertNull(url.port);
        TKAssertEquals(url.encodedString, "//google.com/test/path");

        url = JSURL.initWithString('/test/path');
        url.host = "google.com:8081";
        TKAssertEquals(url.host, "google.com");
        TKAssertExactEquals(url.port, 8081);
        TKAssertEquals(url.encodedString, "//google.com:8081/test/path");
    },

    testGetHasDirectoryPath: function(){
        var url = JSURL.initWithString("http://google.com/test/");
        TKAssert(url.hasDirectoryPath);

        url = JSURL.initWithString("http://google.com/test");
        TKAssert(!url.hasDirectoryPath);
    },

    testSetHasDirectoryPath: function(){
        var url = JSURL.initWithString("http://google.com/test/");
        TKAssert(url.hasDirectoryPath);
        url.hasDirectoryPath = true;
        TKAssert(url.hasDirectoryPath);
        TKAssertEquals(url.pathComponents.length, 2);
        TKAssertEquals(url.encodedString, "http://google.com/test/");
        url.hasDirectoryPath = false;
        TKAssert(!url.hasDirectoryPath);
        TKAssertEquals(url.pathComponents.length, 2);
        TKAssertEquals(url.encodedString, "http://google.com/test");

        url = JSURL.initWithString("http://google.com/test");
        TKAssert(!url.hasDirectoryPath);
        TKAssertEquals(url.pathComponents.length, 2);
        url.hasDirectoryPath = true;
        TKAssert(url.hasDirectoryPath);
        TKAssertEquals(url.pathComponents.length, 2);
        TKAssertEquals(url.encodedString, "http://google.com/test/");
    },

    testSettingHasDirectoryPath: function(){
        var url = JSURL.initWithString("http://google.com/test");
        var url2 = url.settingHasDirectoryPath(true);
        TKAssertNotExactEquals(url, url2);
        TKAssert(!url.hasDirectoryPath);
        TKAssert(url2.hasDirectoryPath);

        url = JSURL.initWithString("http://google.com/test/");
        url2 = url.settingHasDirectoryPath(false);
        TKAssertNotExactEquals(url, url2);
        TKAssert(url.hasDirectoryPath);
        TKAssert(!url2.hasDirectoryPath);
    },

    testParseDataURL: function(){
        var url = JSURL.initWithString("data:,hello%2C%20world!");
        TKAssertNotNull(url);
        TKAssertEquals(url.scheme, "data");
        TKAssertNull(url.mediaType);
        TKAssertNotNull(url.data);
        TKAssertEquals(url.data.stringByDecodingUTF8(), "hello, world!");

        url = JSURL.initWithString("data:text/plain;charset=utf-8;base64,aGVsbG8sIHdvcmxkIQ==");
        TKAssertNotNull(url);
        TKAssertEquals(url.scheme, "data");
        TKAssertEquals(url.mediaType.mime, "text/plain");
        TKAssertEquals(url.mediaType.parameters.charset, "utf-8");
        TKAssertNotNull(url.data);
        TKAssertEquals(url.data.stringByDecodingUTF8(), "hello, world!");
    },

    testDataURLEncodedString: function(){
        var url = JSURL.init();
        url.scheme = "data";
        url.mediaType = JSMediaType("text/plain; charset=utf-8");
        url.data = "hello, world!".utf8();
        var str = url.encodedString;
        TKAssertEquals(str, "data:text/plain;charset=utf-8;base64,aGVsbG8sIHdvcmxkIQ==");
    },

    testOrigin: function(){
        var url = JSURL.initWithString("http://test.breakside.io/test/");
        TKAssertEquals(url.origin, "http://test.breakside.io");

        url = JSURL.initWithString("https://test.breakside.io/test/?one=1#fragment");
        TKAssertEquals(url.origin, "https://test.breakside.io");

        url = JSURL.initWithString("https://user:pass@test.breakside.io/test/?one=1#fragment");
        TKAssertEquals(url.origin, "https://test.breakside.io");

        url = JSURL.initWithString("https://user:pass@test.breakside.io:123/test/?one=1#fragment");
        TKAssertEquals(url.origin, "https://test.breakside.io:123");
    },

    testSetQuery: function(){
        var url = JSURL.initWithString("https://test.breakside.io");
        var query = JSFormFieldMap();
        query.add("a", "1");
        query.add("b", "two");
        url.query = query;
        TKAssertInstance(url.query, JSFormFieldMap);
        TKAssertExactEquals(url.encodedString, "https://test.breakside.io?a=1&b=two");
    },

    testModifyQuery: function(){
        var url = JSURL.initWithString("https://test.breakside.io");
        url.query.add("a", "1");
        url.query.add("b", "two");
        url.query.set("c", "three");
        url.query.unset("b");
        TKAssertInstance(url.query, JSFormFieldMap);
        TKAssertExactEquals(url.encodedString, "https://test.breakside.io?a=1&c=three");
    },

    testIsEqual: function(){
        var url1 = JSURL.initWithString("https://test.breakside.io");
        var url2 = JSURL.initWithString("https://test.breakside.io");
        var equal = url1.isEqual(url2);
        TKAssertExactEquals(equal, true);
        equal = url1.isEqual(url1);
        TKAssertExactEquals(equal, true);
        url2 = JSURL.initWithString("https://test.breakside.io/");
        equal = url1.isEqual(url2);
        TKAssertExactEquals(equal, false);
        url2 = JSURL.initWithString("http://test.breakside.io");
        equal = url1.isEqual(url2);
        TKAssertExactEquals(equal, false);
        url2 = JSURL.initWithString("https://test.breakside.io/");
        equal = url1.isEqual(null);
        TKAssertExactEquals(equal, false);
        url2 = JSURL.initWithString("https://test.breakside.io/");
        equal = url1.isEqual(undefined);
        TKAssertExactEquals(equal, false);
    }

    // TODO: test modifying parts other than path

});
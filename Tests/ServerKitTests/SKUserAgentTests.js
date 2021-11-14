// Copyright 2021 Breakside Inc.
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

// #import ServerKit
// #import TestKit
"use strict";

JSClass("SKUserAgentTests", TKTestSuite, {

    testInitWithString: function(){
        var agent = SKUserAgent.initWithString("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15");
        TKAssertExactEquals(agent.products.length, 4);
        TKAssertExactEquals(agent.products[0].name, "Mozilla");
        TKAssertExactEquals(agent.products[0].version, "5.0");
        TKAssertExactEquals(agent.products[1].name, "AppleWebKit");
        TKAssertExactEquals(agent.products[1].version, "605.1.15");
        TKAssertExactEquals(agent.products[2].name, "Version");
        TKAssertExactEquals(agent.products[2].version, "15.1");
        TKAssertExactEquals(agent.products[3].name, "Safari");
        TKAssertExactEquals(agent.products[3].version, "605.1.15");
        TKAssertExactEquals(agent.containsProduct("Mozilla"), true);
        TKAssertExactEquals(agent.containsProduct("Mozilla", "5.0"), true);
        TKAssertExactEquals(agent.containsProduct("Mozilla", "4.0"), false);
        TKAssertExactEquals(agent.containsProduct("AppleWebKit"), true);
        TKAssertExactEquals(agent.containsProduct("AppleWebKit", "605.1.15"), true);
        TKAssertExactEquals(agent.containsProduct("AppleWebKit", "605.1.14"), false);
        TKAssertExactEquals(agent.containsProduct("Version"), true);
        TKAssertExactEquals(agent.containsProduct("Version", "15.1"), true);
        TKAssertExactEquals(agent.containsProduct("Version", "15.0"), false);
        TKAssertExactEquals(agent.containsProduct("Safari"), true);
        TKAssertExactEquals(agent.containsProduct("Safari", "605.1.15"), true);
        TKAssertExactEquals(agent.containsProduct("Safari", "605.1.14"), false);
        TKAssertExactEquals(agent.containsProduct("Chrome"), false);
        TKAssertExactEquals(agent.versionOfProduct("Mozilla"), "5.0");
        TKAssertExactEquals(agent.versionOfProduct("AppleWebKit"), "605.1.15");
        TKAssertExactEquals(agent.versionOfProduct("Version"), "15.1");
        TKAssertExactEquals(agent.versionOfProduct("Safari"), "605.1.15");
        TKAssertExactEquals(agent.comments.length, 3);
        TKAssertExactEquals(agent.comments[0], "Macintosh");
        TKAssertExactEquals(agent.comments[1], "Intel Mac OS X 10_15_7");
        TKAssertExactEquals(agent.comments[2], "KHTML, like Gecko");
        TKAssertExactEquals(agent.containsComment("Macintosh"), true);
        TKAssertExactEquals(agent.containsComment("Intel Mac OS X 10_15_7"), true);
        TKAssertExactEquals(agent.containsComment("KHTML, like Gecko"), true);

        agent = SKUserAgent.initWithString("APIs-Google (+https://developers.google.com/webmasters/APIs-Google.html)");
        TKAssertExactEquals(agent.products.length, 1);
        TKAssertExactEquals(agent.products[0].name, "APIs-Google");
        TKAssertExactEquals(agent.products[0].version, null);
        TKAssertExactEquals(agent.containsProduct("APIs-Google"), true);
        TKAssertExactEquals(agent.containsProduct("APIs-Google", "1.0"), false);
        TKAssertExactEquals(agent.versionOfProduct("APIs-Google"), null);
        TKAssertExactEquals(agent.comments.length, 1);
        TKAssertExactEquals(agent.comments[0], "+https://developers.google.com/webmasters/APIs-Google.html");

        agent = SKUserAgent.initWithString("Mediapartners-Google");
        TKAssertExactEquals(agent.products.length, 1);
        TKAssertExactEquals(agent.products[0].name, "Mediapartners-Google");
        TKAssertExactEquals(agent.products[0].version, null);
        TKAssertExactEquals(agent.containsProduct("Mediapartners-Google"), true);
        TKAssertExactEquals(agent.containsProduct("Mediapartners-Google", "1.0"), false);
        TKAssertExactEquals(agent.versionOfProduct("Mediapartners-Google"), null);
        TKAssertExactEquals(agent.comments.length, 0);

        agent = SKUserAgent.initWithString("Googlebot-Image/1.0");
        TKAssertExactEquals(agent.products.length, 1);
        TKAssertExactEquals(agent.products[0].name, "Googlebot-Image");
        TKAssertExactEquals(agent.products[0].version, "1.0");
        TKAssertExactEquals(agent.containsProduct("Googlebot-Image"), true);
        TKAssertExactEquals(agent.containsProduct("Googlebot-Image", "1.0"), true);
        TKAssertExactEquals(agent.versionOfProduct("Googlebot-Image"), "1.0");
        TKAssertExactEquals(agent.comments.length, 0);

        agent = SKUserAgent.initWithString("Mozilla/5.0 (Linux; Android 5.0; SM-G920A) AppleWebKit (KHTML, like Gecko) Chrome Mobile Safari (compatible; AdsBot-Google-Mobile; +http://www.google.com/mobile/adsbot.html)");
        TKAssertExactEquals(agent.products.length, 5);
        TKAssertExactEquals(agent.products[0].name, "Mozilla");
        TKAssertExactEquals(agent.products[0].version, "5.0");
        TKAssertExactEquals(agent.products[1].name, "AppleWebKit");
        TKAssertExactEquals(agent.products[1].version, null);
        TKAssertExactEquals(agent.products[2].name, "Chrome");
        TKAssertExactEquals(agent.products[2].version, null);
        TKAssertExactEquals(agent.products[3].name, "Mobile");
        TKAssertExactEquals(agent.products[3].version, null);
        TKAssertExactEquals(agent.products[4].name, "Safari");
        TKAssertExactEquals(agent.products[4].version, null);
        TKAssertExactEquals(agent.comments.length, 7);
        TKAssertExactEquals(agent.comments[0], "Linux");
        TKAssertExactEquals(agent.comments[1], "Android 5.0");
        TKAssertExactEquals(agent.comments[2], "SM-G920A");
        TKAssertExactEquals(agent.comments[3], "KHTML, like Gecko");
        TKAssertExactEquals(agent.comments[4], "compatible");
        TKAssertExactEquals(agent.comments[5], "AdsBot-Google-Mobile");
        TKAssertExactEquals(agent.comments[6], "+http://www.google.com/mobile/adsbot.html");

        agent = SKUserAgent.initWithString("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)");
        TKAssertExactEquals(agent.products.length, 1);
        TKAssertExactEquals(agent.products[0].name, "Mozilla");
        TKAssertExactEquals(agent.products[0].version, "5.0");
        TKAssertExactEquals(agent.comments.length, 3);
        TKAssertExactEquals(agent.comments[0], "compatible");
        TKAssertExactEquals(agent.comments[1], "Googlebot/2.1");
        TKAssertExactEquals(agent.comments[2], "+http://www.google.com/bot.html");

        agent = SKUserAgent.initWithString("Mozilla/5.0 (CrKey armv7l 1.5.16041) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.0 Safari/537.36");
        TKAssertExactEquals(agent.products.length, 4);
        TKAssertExactEquals(agent.products[0].name, "Mozilla");
        TKAssertExactEquals(agent.products[0].version, "5.0");
        TKAssertExactEquals(agent.products[1].name, "AppleWebKit");
        TKAssertExactEquals(agent.products[1].version, "537.36");
        TKAssertExactEquals(agent.products[2].name, "Chrome");
        TKAssertExactEquals(agent.products[2].version, "31.0.1650.0");
        TKAssertExactEquals(agent.products[3].name, "Safari");
        TKAssertExactEquals(agent.products[3].version, "537.36");
        TKAssertExactEquals(agent.comments.length, 2);
        TKAssertExactEquals(agent.comments[0], "CrKey armv7l 1.5.16041");
        TKAssertExactEquals(agent.comments[1], "KHTML, like Gecko");

        agent = SKUserAgent.initWithString("AppleTV6,2/11.1");
        TKAssertExactEquals(agent.products.length, 1);
        TKAssertExactEquals(agent.products[0].name, "AppleTV6,2");
        TKAssertExactEquals(agent.products[0].version, "11.1");
        TKAssertExactEquals(agent.containsProduct("AppleTV6,2"), true);
        TKAssertExactEquals(agent.containsProduct("AppleTV6,2", "11.1"), true);
        TKAssertExactEquals(agent.versionOfProduct("AppleTV6,2"), "11.1");
        TKAssertExactEquals(agent.comments.length, 0);

        agent = SKUserAgent.initWithString("Mozilla/5.0 (Nintendo 3DS; U; ; en) Version/1.7412.EU");
        TKAssertExactEquals(agent.products.length, 2);
        TKAssertExactEquals(agent.products[0].name, "Mozilla");
        TKAssertExactEquals(agent.products[0].version, "5.0");
        TKAssertExactEquals(agent.products[1].name, "Version");
        TKAssertExactEquals(agent.products[1].version, "1.7412.EU");
        TKAssertExactEquals(agent.comments.length, 3);
        TKAssertExactEquals(agent.comments[0], "Nintendo 3DS");
        TKAssertExactEquals(agent.comments[1], "U");
        TKAssertExactEquals(agent.comments[2], "en");

        agent = SKUserAgent.initWithString("Mozilla/5.0 (compatible; Yahoo! Slurp; http://help.yahoo.com/help/us/ysearch/slurp)");
        TKAssertExactEquals(agent.products.length, 1);
        TKAssertExactEquals(agent.products[0].name, "Mozilla");
        TKAssertExactEquals(agent.products[0].version, "5.0");
        TKAssertExactEquals(agent.comments.length, 3);
        TKAssertExactEquals(agent.comments[0], "compatible");
        TKAssertExactEquals(agent.comments[1], "Yahoo! Slurp");
        TKAssertExactEquals(agent.comments[2], "http://help.yahoo.com/help/us/ysearch/slurp");

        agent = SKUserAgent.initWithString("Mozilla/5.0 (Linux; U; en-US) AppleWebKit/528.5+ (KHTML, like Gecko, Safari/528.5+) Version/4.0 Kindle/3.0 (screen 600x800; rotate)");
        TKAssertExactEquals(agent.products.length, 4);
        TKAssertExactEquals(agent.products[0].name, "Mozilla");
        TKAssertExactEquals(agent.products[0].version, "5.0");
        TKAssertExactEquals(agent.products[1].name, "AppleWebKit");
        TKAssertExactEquals(agent.products[1].version, "528.5+");
        TKAssertExactEquals(agent.products[2].name, "Version");
        TKAssertExactEquals(agent.products[2].version, "4.0");
        TKAssertExactEquals(agent.products[3].name, "Kindle");
        TKAssertExactEquals(agent.products[3].version, "3.0");
        TKAssertExactEquals(agent.comments.length, 6);
        TKAssertExactEquals(agent.comments[0], "Linux");
        TKAssertExactEquals(agent.comments[1], "U");
        TKAssertExactEquals(agent.comments[2], "en-US");
        TKAssertExactEquals(agent.comments[3], "KHTML, like Gecko, Safari/528.5+");
        TKAssertExactEquals(agent.comments[4], "screen 600x800");
        TKAssertExactEquals(agent.comments[5], "rotate");

        agent = SKUserAgent.initWithString("");
        TKAssertExactEquals(agent.products.length, 0);
        TKAssertExactEquals(agent.comments.length, 0);

        agent = SKUserAgent.initWithString(" ");
        TKAssertExactEquals(agent.products.length, 0);
        TKAssertExactEquals(agent.comments.length, 0);

        agent = SKUserAgent.initWithString(" \t");
        TKAssertExactEquals(agent.products.length, 0);
        TKAssertExactEquals(agent.comments.length, 0);

        agent = SKUserAgent.initWithString(" \t ");
        TKAssertExactEquals(agent.products.length, 0);
        TKAssertExactEquals(agent.comments.length, 0);

        agent = SKUserAgent.initWithString("test/");
        TKAssertExactEquals(agent.products.length, 1);
        TKAssertExactEquals(agent.products[0].name, "test");
        TKAssertExactEquals(agent.products[0].version, null);
        TKAssertExactEquals(agent.comments.length, 0);

        agent = SKUserAgent.initWithString(" test/ ");
        TKAssertExactEquals(agent.products.length, 1);
        TKAssertExactEquals(agent.products[0].name, "test");
        TKAssertExactEquals(agent.products[0].version, null);
        TKAssertExactEquals(agent.comments.length, 0);

        agent = SKUserAgent.initWithString(" test/ (");
        TKAssertExactEquals(agent.products.length, 1);
        TKAssertExactEquals(agent.products[0].name, "test");
        TKAssertExactEquals(agent.products[0].version, null);
        TKAssertExactEquals(agent.comments.length, 0);

        agent = SKUserAgent.initWithString(" test/(");
        TKAssertExactEquals(agent.products.length, 1);
        TKAssertExactEquals(agent.products[0].name, "test");
        TKAssertExactEquals(agent.products[0].version, null);
        TKAssertExactEquals(agent.comments.length, 0);

        agent = SKUserAgent.initWithString(" test/ ()");
        TKAssertExactEquals(agent.products.length, 1);
        TKAssertExactEquals(agent.products[0].name, "test");
        TKAssertExactEquals(agent.products[0].version, null);
        TKAssertExactEquals(agent.comments.length, 0);

        agent = SKUserAgent.initWithString(" test/ (;;;)");
        TKAssertExactEquals(agent.products.length, 1);
        TKAssertExactEquals(agent.products[0].name, "test");
        TKAssertExactEquals(agent.products[0].version, null);
        TKAssertExactEquals(agent.comments.length, 0);

        agent = SKUserAgent.initWithString(null);
        TKAssertNull(agent);

        agent = SKUserAgent.initWithString(undefined);
        TKAssertNull(agent);
    },

});
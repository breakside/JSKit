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
'use strict';

JSClass("CKTURNService", JSObject, {

    initWithHost: function(host, port, username, password){
        var url = JSURL.init();
        url.scheme = "turn";
        url.host = host;
        url.port = port;
        this.initWithURL(url, username, password);
    },

    initWithURL: function(url, username, password){
        this.url = url;
        this.username = username || null;
        this.password = password || null;
    },

    url: null,
    username: null,
    password: null

});
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
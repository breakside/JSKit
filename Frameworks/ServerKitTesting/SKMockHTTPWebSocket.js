// #import ServerKit
'use strict';

JSClass("SKMockHTTPWebSocket", SKHTTPWebSocket, {

    mockClientParser: null,

    initWithClientParser: function(mockClientParser){
        SKMockHTTPWebSocket.$super.init.call(this);
        this.mockClientParser = mockClientParser;
    },

    _write: function(data){
        JSRunLoop.main.schedule(this.mockClientParser.receive, this.mockClientParser, data);
    },

});
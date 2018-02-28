// #import "Foundation/Foundation.js"
/* global JSProtocol */
'use strict';

JSProtocol("SKHTTPWebSocketDelegate", JSProtocol, {

    socketDidReceiveData: ['socket', 'data'],
    socketDidReceiveMessage: ['socket', 'chunks']

});
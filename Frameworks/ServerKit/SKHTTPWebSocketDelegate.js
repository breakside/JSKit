// #import Foundation
/* global JSProtocol */
'use strict';

JSProtocol("SKHTTPWebSocketDelegate", JSProtocol, {

    socketDidReceiveData: function(socket, data){},
    socketDidReceiveMessage: function(socket, chunks){},
    socketDidClose: function(socket){}

});
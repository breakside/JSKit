// #import Foundation
'use strict';

JSProtocol("UIDraggingDestination", JSProtocol, {

    draggingEntered: function(session){},
    draggingUpdated: function(session){},
    draggingExited: function(session){},

    performDragOperation: function(session, operation){}

});

JSGlobalObject.UIDragOperation = {
    none: 0,
    copy: 1,
    link: 2,
    move: 4,
    all: 7
};
// #import Foundation
/* global JSProtocol, JSGlobalObject */
'use strict';

JSProtocol("UIDraggingDestination", JSProtocol, {

    draggingEntered: ["session"],
    draggingUpdated: ["session"],
    draggingExited: ["session"],

    performDragOperation: ["session", "operation"]

});

JSGlobalObject.UIDragOperation = {
    none: 0,
    copy: 1,
    link: 2,
    move: 4,
    all: 7
};
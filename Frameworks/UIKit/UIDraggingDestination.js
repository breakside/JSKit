// #import "Foundation/Foundation.js"
/* global JSProtocol, JSGlobalObject */
'use strict';

JSProtocol("UIDraggingDestination", JSProtocol, {

    draggingEntered: ["info"],
    draggingUpdated: ["info"],
    draggingEnded: ["info"],
    draggingExited: ["info"],

    performDragOperation: ["info"]    

});

JSGlobalObject.UIDragOperation = {
    none: 0,
    copy: 1,
    link: 2,
    move: 4,
    all: 7
};
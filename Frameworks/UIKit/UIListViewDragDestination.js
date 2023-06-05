// #import Foundation
"use strict";

JSClass("UIListViewDragDestination", JSObject, {

    indexPath: null,
    dropLocation: 0,

    init: function(){
    },

});

UIListViewDragDestination.DropLocation = {
    none: 0,
    onList: 1,
    onSection: 2,
    onRow: 3,
    insertRow: 4
};
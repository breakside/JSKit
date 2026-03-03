// #import Foundation
"use strict";

JSClass("UITextAction", JSObject, {

    title: null,
    action: null,
    target: null,

    initWithTitle: function(title, action, target){
        this.title = title;
        this.action = action;
        this.target = target || null;
    },

});

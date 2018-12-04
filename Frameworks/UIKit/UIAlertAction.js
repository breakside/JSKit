// #import "Foundation/Foundation.js"
/* global JSClass, JSObject, UIAlertAction */
'use strict';

JSClass("UIAlertAction", JSObject, {

    initWithTitle: function(title, style, action, target){
        this.title = title;
        this.style = style || 0;
        this.action = action || null;
        this.target = target || null;
    },

    title: null,
    style: 0,
    action: null,
    target: null

});

UIAlertAction.Style = {
    default: 0,
    cancel: 1,
    destructive: 2
};
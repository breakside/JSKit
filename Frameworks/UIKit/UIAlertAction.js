// #import Foundation
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
    normal: 0,
    default: 1,
    cancel: 2,
    destructive: 3
};
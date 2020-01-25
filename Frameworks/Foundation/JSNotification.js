// #import "JSObject.js"
'use strict';

JSClass("JSNotification", JSObject, {

    name: null,
    sender: null,
    userInfo: null,

    initWithName: function(name, sender, userInfo){
        this.name = name;
        this.sender = sender;
        if (userInfo !== null){
            this.userInfo = userInfo;
        }
    }

});
// #import "Foundation/JSObject.js"
/* global JSClass, JSObject, JSReadOnlyProperty */
'use strict';

JSClass("JSUserDefaults", JSObject, {

    identifier: JSReadOnlyProperty('_identifier', null),

    initWithIdentifier: function(identifier){
        this._identifier = identifier;
    },

});
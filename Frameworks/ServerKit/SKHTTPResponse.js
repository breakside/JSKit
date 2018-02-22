// #import "Foundation/Foundation.js"
/* global JSClass, JSObject, JSDynamicProperty, JSReadOnlyProperty, JSURLResponse, SKHTTPResponse */
'use strict';

JSClass("SKHTTPResponse", JSObject, {

    statusCode: JSDynamicProperty('_statusCode', 200),

    complete: function(){
    }

});

SKHTTPResponse.StatusCode = JSURLResponse.StatusCode;
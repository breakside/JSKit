// #import Foundation
'use strict';

JSClass("UIState", JSObject, {

    url: null,
    routes: null,
    matches: null,

    initWithURL: function(url){
        this.url = url;
    },

});
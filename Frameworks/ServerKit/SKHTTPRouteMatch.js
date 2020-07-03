// #import Foundation
'use strict';

JSClass("SKHTTPRouteMatch", JSObject, {

    route: null,
    matches: null,

    initWithRoute: function(route, matches){
        this.route = route;
        this.matches = matches;
    }

});
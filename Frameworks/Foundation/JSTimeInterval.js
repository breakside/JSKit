'use strict';

JSGlobalObject.JSTimeInterval = {

    milliseconds: function(ms){
        return ms / 1000.0;
    },

    seconds: function(s){
        return s;
    },

    minutes: function(m){
        return 60 * m;
    },

    hours: function(h){
        return 3600 * h;
    }

};
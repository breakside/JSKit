// #import Foundation
"use strict";

JSClass("CHChart", JSObject, {

    init: function(){
        this.series = [];
    },

    series: null,

    addSeries: function(series){
        this.series.push(series);
    },

    drawInContext: function(context){
    }

});
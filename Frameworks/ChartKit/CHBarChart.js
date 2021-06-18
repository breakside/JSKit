// #import "CHChart.js"
// #import "CHAxis.js"
"use strict";

JSClass("CHBarChart", CHChart, {

    init: function(){
        this.valueAxis = CHAxis.init();
        this.categoryAxis = CHAxis.init();
    },

    valueAxis: null,
    categoryAxis: null,

});
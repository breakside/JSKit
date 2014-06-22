// #import "Foundation/Foundation.js"
// #import "JSKit/JSObject.js"
// #import "JSKit/JSColor.js"

JSClass('JSGradient', JSObject, {

    stops: null,
    start: null,
    end: null,

    init: function(){
        JSGradient.$super.init.call(this);
        this.start = JSPoint(0,0);
        this.end = JSPoint(0,1.0);
        this.stops = {};
    },

    initWithStops: function(position1, color1 /* , ... */){
        this.init();
        var args = arguments.slice(0);
        for (var i = 0, l = args.length; i + 1 < l; i += 2){
            this.addStop(args[i], args[i + 1]);
        }
    },

    addStop: function(position, color){
        this.stops[position] = color;
    }

});

JSGradient.gradientBetweenColors = function(color1, color2){
    return JSGradient.initWithStops(0, color1, 1, color2);
};
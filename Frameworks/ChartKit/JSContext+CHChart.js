// #import Foundation
"use strict";

JSContext.definePropertiesFromExtensions({

    drawChartInRect: function(chart, rect){
        this.save();
        this.translateBy(rect.origin.x, rect.origin.y);
        chart.drawInContext(this, rect.size);
        this.restore();
    }

});
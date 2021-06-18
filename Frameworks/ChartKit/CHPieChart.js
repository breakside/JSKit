// #import "CHChart.js"
// #import "CHTheme.js"
"use strict";

(function(){

JSClass("CHPieChart", CHChart, {

    init: function(){
        CHPieChart.$super.init.call(this);
        this.colors = CHTheme.default.colors;
        this.labelFormatter = JSNumberFormatter.init();
        this.labelFormatter.format = "0%";
        this.labelFormatter.multiplier = 100;
        this.labelFont = JSFont.systemFontOfSize(JSFont.Size.normal).fontWithWeight(JSFont.Weight.bold);
        this.labelTextColor = JSColor.white;
        this.labelShadowColor = JSColor.black.colorWithAlpha(0.4);
        this.labelShadowOffset = JSPoint(1, 1);
    },

    colors: null,
    labelFormatter: null,
    labelPosition: 0.66,
    labelFont: null,
    labelTextColor: null,
    labelTextAlignment: JSTextAlignment.center,
    labelShadowColor: null,
    labelShadowOffset: null,
    labelShadowRadius: 0,

    drawInContext: function(context, size){
        this.drawPieInContextInRect(context, JSRect(JSPoint.Zero, size));
        // TODO: legend
    },

    drawPieInContextInRect: function(context, rect){
        if (this.series.length < 1){
            return;
        }

        // prepare values
        // - make all values positive
        // - make non-numbers 0
        // - caclulate total of all values
        var values = JSCopy(this.series[0]);
        var total = 0;
        var i, l;
        for (i = 0, l = values.length; i < l; ++i){
            if (isNaN(values[i])){
                values[i] = 0;
            }else if (values[i] < 0){
                values[i] = -values[i];
            }
            total += values[i];
        }
        if (total === 0){
            return;
        }

        // draw slices
        context.save();

        var diameter = Math.min(rect.size.height, rect.size.width);
        var radius = diameter / 2;
        var colorIndex = 0;
        context.translateBy(rect.center.x, rect.center.y);

        var value, percentage;
        var a0 = 0;
        var a1;
        var center = JSPoint.Zero;
        context.rotateBy(-Math.PI / 2);
        for (i = 0, l = values.length; i < l; ++i){
            value = values[i];
            percentage = value / total;
            a1 = (i < l - 1) ? (a0 + TWO_PI * percentage) : 0;
            context.setFillColor(this.colors[colorIndex]);
            context.beginPath();
            context.moveToPoint(center.x, center.y);
            context.addArc(center, radius, a0, a1 + ((i < l - 1) ? 0.01 : 0), true);
            context.closePath();
            context.fillPath();
            ++colorIndex;
            a0 = a1;
        }

        context.restore();

        // draw labels
        context.save();
        context.translateBy(rect.center.x, rect.center.y);
        context.setFillColor(this.labelTextColor);
        context.setFont(this.labelFont);
        if (this.labelShadowColor !== null){
            context.setShadow(this.labelShadowOffset, this.labelShadowRadius, this.labelShadowColor);
        }
        var label;
        var width;
        var height = this.labelFont.lineHeight;
        var position;
        a0 = TWO_PI - Math.PI / 2;
        for (i = 0, l = values.length; i < l; ++i){
            value = values[i];
            percentage = value / total;
            a1 = (i < l - 1) ? (a0 + TWO_PI * percentage) : -Math.PI / 2;
            position = JSPoint(
                Math.cos(a0 + (a1 - a0) / 2) * radius * this.labelPosition,
                Math.sin(a0 + (a1 - a0 ) / 2) * radius * this.labelPosition
            );
            label = this.labelFormatter.stringFromNumber(percentage);
            width = this.labelFont.widthOfString(label);
            position.x -= width / 2;
            position.y += height / 2;
            context.setTextMatrix(JSAffineTransform.Translated(position.x, position.y));
            context.showText(label);
            context.beginPath();
            a0 = a1;
        }
        context.restore();
    }

});

var TWO_PI = Math.PI * 2;

})();
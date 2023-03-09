// Copyright 2021 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #import "CHChart.js"
// #import "CHTheme.js"
// #import "CHSeries.js"
// #import "CHLegend.js"
"use strict";

(function(){

JSClass("CHPieChart", CHChart, {

    initWithTheme: function(theme){
        CHPieChart.$super.initWithTheme.call(this, theme);
        this.valueFormatter = JSNumberFormatter.init();
        this.valueFormatter.format = "0%";
        this.valueFormatter.multiplier = 100;
        this.labelFont = JSFont.systemFontOfSize(JSFont.Size.normal).bolderFont();
        this.labelTextColor = JSColor.white;
        this.labelShadowColor = JSColor.black.colorWithAlpha(0.4);
        this.labelShadowOffset = JSPoint(1, 1);
        this.framesetter = JSTextFramesetter.init();
        this.legend = CHLegend.initWithStyle(theme.legendStyle.copy());
        this.legend.delegate = this;
        this.legend.placement = CHLegend.Placement.right;
        this.defaultSeriesStyle = theme.wedgeStyle.styleWithColor(null);
    },

    setDataPoints: function(points, names){
        var series;
        var color;
        var style;
        for (var i = 0, l = points.length; i < l; ++i){
            color = this.colorForSeriesAtIndex(this.series.length);
            style = this.defaultSeriesStyle.styleWithColor(color);
            series = CHSeries.initWithName(names[i], style, [points[i]]);
            this.addSeries(series);
        }
    },

    showNames: false,
    showValues: true,
    showValuesAsPercentages: JSDynamicProperty("_showValuesAsPercentages", true),

    setShowValuesAsPercentages: function(showValuesAsPercentages){
        this._showValuesAsPercentages = showValuesAsPercentages;
        if (showValuesAsPercentages){
            this.valueFormatter.multiplier = 100;
            if (this.valueFormatter.format.indexOf("%") < 0){
                this.valueFormatter.format = "#,##0%";
            }
        }else{
            this.valueFormatter.multiplier = 1;
            if (this.valueFormatter.format.indexOf("%") >= 0){
                this.valueFormatter.format = "#,##0";
            }
        }
    },

    valueFormatter: null,
    labelPosition: 0.67,
    labelFont: null,
    labelTextColor: null,
    labelTextAlignment: JSTextAlignment.center,
    labelShadowColor: null,
    labelShadowOffset: null,
    labelShadowRadius: 0,

    legend: null,
    defaultSeriesStyle: null,

    drawInContext: function(context, size){
        var pieRect = JSRect(JSPoint.Zero, size);
        if (this.legend.placement != CHLegend.Placement.none){
            var legendRect;
            var legendSize = this.legend.sizeThatFitsSize(size);
            switch (this.legend.placement){
                case CHLegend.Placement.above:
                    pieRect = pieRect.rectWithInsets(legendSize.height, 0, 0, 0);
                    legendRect = JSRect(JSPoint((size.width - legendSize.width) / 2, 0), legendSize);
                    break;
                case CHLegend.Placement.below:
                    pieRect = pieRect.rectWithInsets(0, 0, legendSize.height, 0);
                    legendRect = JSRect(JSPoint((size.width - legendSize.width) / 2, size.height - legendSize.height), legendSize);
                    break;
                case CHLegend.Placement.left:
                    pieRect = pieRect.rectWithInsets(0, legendSize.width, 0, 0);
                    legendRect = JSRect(JSPoint(0, (size.height - legendSize.height) / 2), legendSize);
                    break;
                case CHLegend.Placement.right:
                    pieRect = pieRect.rectWithInsets(0, 0, 0, legendSize.width);
                    legendRect = JSRect(JSPoint(size.width - legendSize.width, (size.height - legendSize.height) / 2), legendSize);
                    break;
            }
            this.legend.drawInContext(context, legendRect);
        }
        this.drawPieInContext(context, pieRect);
    },

    drawPieInContext: function(context, rect){
        if (this.series.length < 1){
            return;
        }

        // prepare values
        // - make all values positive
        // - make non-numbers 0
        // - caclulate total of all values
        var values = [];
        var total = 0;
        var i, l;
        for (i = 0, l = this.series.length; i < l; ++i){
            values.push(this.series[i].values[0]);
        }
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
        context.translateBy(rect.center.x, rect.center.y);

        var value, percentage;
        var a0 = 0;
        var a1;
        var center = JSPoint.Zero;
        context.rotateBy(-Math.PI / 2);
        for (i = 0, l = values.length; i < l; ++i){
            value = values[i];
            if (value > 0){
                percentage = value / total;
                a1 = (i < l - 1) ? (a0 + TWO_PI * percentage) : 0;
                context.setFillColor(this.series[i].style.color);
                context.beginPath();
                context.moveToPoint(center.x, center.y);
                context.addArc(center, radius, a0, a1 + ((i < l - 1) ? 0.01 : 0), true);
                context.closePath();
                context.fillPath();
                a0 = a1;
            }
        }

        context.restore();

        // draw labels
        if (this.showNames || this.showValues){
            this.framesetter.defaultParagraphStyle.textAlignment = this.labelTextAlignment;
            context.save();
            context.translateBy(rect.center.x, rect.center.y);
            if (this.labelShadowColor !== null){
                context.setShadow(this.labelShadowOffset, this.labelShadowRadius, this.labelShadowColor);
            }
            var labelText;
            var labelTextFrame;
            var height = this.labelFont.lineHeight;
            var position;
            a0 = TWO_PI - Math.PI / 2;
            for (i = 0, l = values.length; i < l; ++i){
                value = values[i];
                if (value > 0){
                    percentage = value / total;
                    a1 = (i < l - 1) ? (a0 + TWO_PI * percentage) : -Math.PI / 2;
                    position = JSPoint(
                        Math.cos(a0 + (a1 - a0) / 2) * radius * this.labelPosition,
                        Math.sin(a0 + (a1 - a0 ) / 2) * radius * this.labelPosition
                    );
                    labelText = "";
                    if (this.showNames){
                        labelText = this.series[i].name;
                        if (this.showValues){
                            labelText += "\n";
                        }
                    }
                    if (this.showValues){
                        labelText += this.valueFormatter.stringFromNumber(this._showValuesAsPercentages ? percentage : value);
                    }
                    this.framesetter.attributedString = JSAttributedString.initWithString(labelText, {
                        font: this.labelFont,
                        textColor: this.labelTextColor
                    });
                    labelTextFrame = this.framesetter.createFrame(JSSize.Zero, JSRange(0, labelText.length));
                    position.x -= labelTextFrame.size.width / 2;
                    position.y -= labelTextFrame.size.height / 2;
                    labelTextFrame.drawInContextAtPoint(context, position);
                    a0 = a1;
                }
            }
            context.restore();
        }
    },

    drawSymbolForNameInLegendAtIndex: function(legend, index, context, rect){
        var series = this.series[index];
        context.setFillColor(series.style.color);
        context.addEllipseInRect(rect);
        context.fillPath();
    }

});

var TWO_PI = Math.PI * 2;

})();
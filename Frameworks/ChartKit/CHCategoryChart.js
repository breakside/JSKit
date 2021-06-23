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
// #import "CHValueAxis.js"
// #import "CHCategoryAxis.js"
// #import "CHLegend.js"
// #import "CHSeries.js"
"use strict";

JSClass("CHCategoryChart", CHChart, {

    initWithTheme: function(theme){
        CHCategoryChart.$super.initWithTheme.call(this, theme);
        this.valueAxis = CHValueAxis.init();
        this.valueAxis.lineWidth = 0;
        this.valueAxis.majorGridlineWidth = 0.5;
        this.valueAxis.showsLabels = true;
        this.categoryAxis = CHCategoryAxis.init();
        this.categoryAxis.lineWidth = 2;
        this.categoryAxis.majorTickMarkLength = 6;
        this.categoryAxis.minorTickMarkLength = 4;
        this.categoryAxis.edge = CHAxis.Edge.trailing;
        this.categoryAxis.showsLabels = true;
        this.valueDirection = CHAxis.Direction.vertical;
        this.legend = CHLegend.initWithSeries(this.series);
        this.legend.placement = CHLegend.Placement.none;
        this.chartInsets = JSInsets(10, 5);
    },

    valueAxis: null,
    categoryAxis: null,
    valueDirection: JSDynamicProperty("_valueDirection", 0),
    chartInsets: null,

    legend: null,

    setValueDirection: function(valueDirection){
        this._valueDirection = valueDirection;
        this.valueAxis.direction = this._valueDirection;
        this.categoryAxis.direction = this._valueDirection === CHAxis.Direction.vertical ? CHAxis.Direction.horizontal : CHAxis.Direction.vertical;
    },

    addValues: function(values, name){
        var series = CHSeries.initWithName(name, this.colorForSeriesAtIndex(this.series.length), values);
        this.addSeries(series);
    },

    addSeries: function(series){
        CHCategoryChart.$super.addSeries.call(this, series);
        if (this.valueAxis.adjustsToFit){
            this.valueAxis.updateRangeForValues(series.values);
        }
    },

    drawInContext: function(context, size){
        var chartRect = JSRect(JSPoint.Zero, size);
        if (this.legend.placement != CHLegend.Placement.none){
            var legendRect;
            var legendSize = this.legend.sizeThatFitsSize(size);
            switch (this.legend.placement){
                case CHLegend.Placement.above:
                    chartRect = chartRect.rectWithInsets(legendSize.height, 0, 0, 0);
                    legendRect = JSRect(JSPoint((size.width - legendSize.width) / 2, 0), legendSize);
                    break;
                case CHLegend.Placement.below:
                    chartRect = chartRect.rectWithInsets(0, 0, legendSize.height, 0);
                    legendRect = JSRect(JSPoint((size.width - legendSize.width) / 2, size.height - legendSize.height), legendSize);
                    break;
                case CHLegend.Placement.left:
                    chartRect = chartRect.rectWithInsets(0, legendSize.width, 0, 0);
                    legendRect = JSRect(JSPoint(0, (size.height - legendSize.height) / 2), legendSize);
                    break;
                case CHLegend.Placement.right:
                    chartRect = chartRect.rectWithInsets(0, 0, 0, legendSize.width);
                    legendRect = JSRect(JSPoint(size.width - legendSize.width, (size.height - legendSize.height) / 2), legendSize);
                    break;
            }
            this.legend.drawInContext(context, legendRect);
        }
        chartRect = chartRect.rectWithInsets(this.chartInsets);
        var valuesRect = JSRect(chartRect);
        var verticalAxis;
        var horizontalAxis;
        if (this.valueAxis.direction === CHAxis.Direction.vertical){
            verticalAxis = this.valueAxis;
            horizontalAxis = this.categoryAxis;
        }else{
            verticalAxis = this.categoryAxis;
            horizontalAxis = this.valueAxis;
        }
        var verticalAxisRect = JSRect.Zero;
        var horizontalAxisRect = JSRect.Zero;
        verticalAxisRect.size = verticalAxis.sizeThatFitsSize(chartRect.size);
        if (verticalAxis.edge == CHAxis.Edge.trailing){
            valuesRect = valuesRect.rectWithInsets(JSInsets(0, 0, 0, verticalAxisRect.size.width));
            verticalAxisRect.origin = JSPoint(chartRect.origin.x + chartRect.size.width - verticalAxisRect.size.width, chartRect.origin.y);
        }else{
            valuesRect = valuesRect.rectWithInsets(JSInsets(0, verticalAxisRect.size.width, 0, 0));
            verticalAxisRect.origin = JSPoint(chartRect.origin.x, chartRect.origin.y);
        }
        horizontalAxisRect.size = horizontalAxis.sizeThatFitsSize(JSSize(chartRect.size.width - verticalAxisRect.size.width, chartRect.size.height));
        verticalAxisRect.size.height -= horizontalAxisRect.size.height;
        if (horizontalAxis.edge == CHAxis.Edge.trailing){
            valuesRect = valuesRect.rectWithInsets(JSInsets(0, 0, horizontalAxisRect.size.height, 0));
            horizontalAxisRect.origin = JSPoint(chartRect.origin.x, chartRect.origin.y + chartRect.size.height - horizontalAxisRect.size.height);
        }else{
            valuesRect = valuesRect.rectWithInsets(JSInsets(horizontalAxisRect.size.height, 0, 0, 0));
            horizontalAxisRect.origin = JSPoint(chartRect.origin.x, chartRect.origin.y);
            verticalAxisRect.origin.y += horizontalAxisRect.size.height;
        }
        if (verticalAxis.edge == CHAxis.Edge.leading){
            horizontalAxisRect.origin.x += verticalAxisRect.size.width;
        }
        verticalAxis.drawInContext(context, verticalAxisRect, valuesRect);
        horizontalAxis.drawInContext(context, horizontalAxisRect, valuesRect);
        this.drawValuesInContext(context, valuesRect);
    },

    drawValuesInContext: function(context, rect){
    }

});
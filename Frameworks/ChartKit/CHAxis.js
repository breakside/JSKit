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

// #import Foundation
// #import "CHAxisStyle.js"
"use strict";

JSClass("CHAxis", JSObject, {

    initWithStyle: function(style){
        this.framesetter = JSTextFramesetter.init();
        this.style = style;
    },

    init: function(){
        var style = CHAxisStyle.init();
        this.initWithStyle(style);
    },

    direction: 0,
    edge: 0,
    name: null,
    style: null,

    sizeThatFitsSize: function(maxSize){
        var size = JSSize.Zero;
        var labelSize = JSSize.Zero;
        if (this.style.showsLabels){
            labelSize = this.sizeOfLargestLabel();
            // TODO: consider effect of label angle
            labelSize.width += this.style.labelInsets.width;
            labelSize.height += this.style.labelInsets.height;
        }
        var majorTickMarkLength = this.style.majorTickMarkStyle !== CHAxisStyle.TickMarkStyle.none ? this.style.majorTickMarkLength : 0;
        var minorTickMarkLength = this.style.minorTickMarkStyle !== CHAxisStyle.TickMarkStyle.none ? this.style.minorTickMarkLength : 0;
        if (this.direction === CHAxis.Direction.horizontal){
            size.width = maxSize.width;
            size.height += Math.max(this.style.lineWidth / 2, majorTickMarkLength, minorTickMarkLength);
            size.height += labelSize.height;
        }else{
            size.height = maxSize.height;
            size.width += Math.max(this.style.lineWidth / 2, majorTickMarkLength, minorTickMarkLength);
            size.width += labelSize.width;
        }
        return size;
    },

    sizeOfLargestLabel: function(){
        var labels = this.getMajorLabels();
        var size = JSSize(0, this.style.labelFont.lineHeight);
        var width;
        for (var i = 0, l = labels.length; i < l; ++i){
            if (labels[i] !== null && labels[i] !== undefined && labels[i] !== ""){
                width = this.style.labelFont.widthOfString(labels[i]);
                if (width > size.width){
                    size.width = width;
                }
            }
        }
        return size;
    },

    drawInContext: function(context, rect, chartRect){
        if (this.direction === CHAxis.Direction.vertical){
            this.drawVerticallyInContext(context, rect, chartRect);
        }else{
            this.drawHorizontallyInContext(context, rect, chartRect);
        }
    },

    drawHorizontallyInContext: function(context, rect, chartRect){
        context.save();

        var i, l;
        var x, y;
        var majorPositions = this.getMajorPositions(rect.origin.x, rect.origin.x + rect.size.width);
        var minorPositions = this.getMinorPositions(rect.origin.x, rect.origin.x + rect.size.width);

        // gridlines
        if (this.style.minorGridlineWidth > 0){
            context.save();
            context.setStrokeColor(this.style.minorGridlineColor);
            context.setLineWidth(this.style.minorGridlineWidth);
            if (this.style.minorGridlineDashLengths !== null){
                context.setLineDash(0, this.style.minorGridlineDashLengths);
            }
            context.beginPath();
            for (i = 0, l = minorPositions.length; i < l; ++i){
                x = minorPositions[i];
                context.moveToPoint(x, chartRect.origin.y + chartRect.size.height);
                context.addLineToPoint(x, chartRect.origin.y);
            }
            context.strokePath();
            context.restore();
        }
        if (this.style.majorGridlineWidth > 0){
            context.save();
            context.setStrokeColor(this.style.majorGridlineColor);
            context.setLineWidth(this.style.majorGridlineWidth);
            if (this.style.majorGridlineDashLengths !== null){
                context.setLineDash(0, this.style.majorGridlineDashLengths);
            }
            context.beginPath();
            for (i = 0, l = majorPositions.length; i < l; ++i){
                x = majorPositions[i];
                context.moveToPoint(x, chartRect.origin.y + chartRect.size.height);
                context.addLineToPoint(x, chartRect.origin.y);
            }
            context.strokePath();
            context.restore();
        }

        if (this.edge === CHAxis.Edge.trailing){
            y = rect.origin.y;
        }else{
            y = rect.origin.y + rect.size.height;
        }

        // tick marks
        var minorTickMarkLength = 0;
        var minorTickMarkRange = this.rangeForTickMarkStyle(this.style.minorTickMarkStyle, this.style.minorTickMarkLength, y);
        if (this.style.minorTickMarkStyle !== CHAxisStyle.TickMarkStyle.none){
            minorTickMarkLength = this.style.minorTickMarkLength;
            context.save();
            context.setStrokeColor(this.style.minorTickMarkColor);
            context.setLineWidth(this.style.minorTickMarkWidth);
            context.beginPath();
            for (i = 0, l = minorPositions.length; i < l; ++i){
                x = minorPositions[i];
                context.moveToPoint(x, minorTickMarkRange.end);
                context.addLineToPoint(x, minorTickMarkRange.location);
            }
            context.strokePath();
            context.restore();
        }
        var majorTickMarkLength = 0;
        var majorTickMarkRange = this.rangeForTickMarkStyle(this.style.majorTickMarkStyle, this.style.majorTickMarkLength, y);
        if (this.style.majorTickMarkStyle !== CHAxisStyle.TickMarkStyle.none){
            majorTickMarkLength = this.style.majorTickMarkLength;
            context.save();
            context.setStrokeColor(this.style.majorTickMarkColor);
            context.setLineWidth(this.style.majorTickMarkWidth);
            context.beginPath();
            for (i = 0, l = majorPositions.length; i < l; ++i){
                x = majorPositions[i];
                context.moveToPoint(x, majorTickMarkRange.end);
                context.addLineToPoint(x, majorTickMarkRange.location);
            }
            context.strokePath();
            context.restore();
        }

        // line
        if (this.style.lineWidth > 0){
            context.setStrokeColor(this.style.lineColor);
            context.setLineWidth(this.style.lineWidth);
            context.moveToPoint(rect.origin.x, y);
            context.addLineToPoint(rect.origin.x + rect.size.width, y);
            context.strokePath();
        }

        // labels
        if (this.style.showsLabels){
            var labels = this.getMajorLabels();
            var maxLabelSize = JSSize(0, 0);
            var labelInsets = JSInsets(this.style.labelInsets);
            var labelTextFrame;
            if (this.edge === CHAxis.Edge.leading){
                this.framesetter.attributes.textAlignment = JSTextAlignment.right;
                labelInsets.bottom += Math.max(this.style.lineWidth / 2, majorTickMarkLength, minorTickMarkLength);
            }else{
                this.framesetter.attributes.textAlignment = JSTextAlignment.left;
                labelInsets.top += Math.max(this.style.lineWidth / 2, majorTickMarkLength, minorTickMarkLength);
            }
            var labelOrigin = JSPoint(0, rect.origin.y + this.style.labelInsets.top);
            this.framesetter.attributes.textAlignment = JSTextAlignment.left;
            for (i = 0, l = labels.length; i < l; ++i){
                if (labels[i] !== null && labels[i] !== undefined && labels[i] !== ""){
                    this.framesetter.attributedString = JSAttributedString.initWithString(labels[i], {
                        font: this.style.labelFont,
                        textColor: this.style.labelTextColor
                    });
                    labelTextFrame = this.framesetter.createFrame(maxLabelSize, JSRange(0, labels[i].length), 1);
                    labelOrigin.x = majorPositions[i] - labelTextFrame.size.width / 2;
                    if (this.style.labelPosition === CHAxisStyle.LabelPosition.betweenTickMarks){
                        labelOrigin.x += (majorPositions[i + 1] - majorPositions[i]) / 2;
                    }
                    labelTextFrame.drawInContextAtPoint(context, labelOrigin);
                }
            }
        }

        context.restore();
        
    },

    drawVerticallyInContext: function(context, rect, chartRect){
        context.save();

        var i, l;
        var x, y;
        var majorPositions = this.getMajorPositions(rect.origin.y + rect.size.height, rect.origin.y);
        var minorPositions = this.getMinorPositions(rect.origin.y + rect.size.height, rect.origin.y);

        // gridlines
        if (this.style.minorGridlineWidth > 0){
            context.save();
            context.setStrokeColor(this.style.minorGridlineColor);
            context.setLineWidth(this.style.minorGridlineWidth);
            if (this.style.minorGridlineDashLengths !== null){
                context.setLineDash(0, this.style.minorGridlineDashLengths);
            }
            context.beginPath();
            for (i = 0, l = minorPositions.length; i < l; ++i){
                y = minorPositions[i];
                context.moveToPoint(chartRect.origin.x, y);
                context.addLineToPoint(chartRect.origin.x + chartRect.size.width, y);
            }
            context.strokePath();
            context.restore();
        }
        if (this.style.majorGridlineWidth > 0){
            context.save();
            context.setStrokeColor(this.style.majorGridlineColor);
            context.setLineWidth(this.style.majorGridlineWidth);
            if (this.style.majorGridlineDashLengths !== null){
                context.setLineDash(0, this.style.majorGridlineDashLengths);
            }
            context.beginPath();
            for (i = 0, l = majorPositions.length; i < l; ++i){
                y = majorPositions[i];
                context.moveToPoint(chartRect.origin.x, y);
                context.addLineToPoint(chartRect.origin.x + chartRect.size.width, y);
            }
            context.strokePath();
            context.restore();
        }

        if (this.edge === CHAxis.Edge.trailing){
            x = rect.origin.x;
        }else{
            x = rect.origin.x + rect.size.width;
        }

        // tick marks
        var minorTickMarkLength = 0;
        var minorTickMarkRange = this.rangeForTickMarkStyle(this.style.minorTickMarkStyle, this.style.minorTickMarkLength, x);
        if (this.style.minorTickMarkStyle !== CHAxisStyle.TickMarkStyle.none){
            minorTickMarkLength = this.style.minorTickMarkLength;
            context.save();
            context.setStrokeColor(this.style.minorTickMarkColor);
            context.setLineWidth(this.style.minorTickMarkWidth);
            context.beginPath();
            for (i = 0, l = minorPositions.length; i < l; ++i){
                y = minorPositions[i];
                context.moveToPoint(minorTickMarkRange.location, y);
                context.addLineToPoint(minorTickMarkRange.end, y);
            }
            context.strokePath();
            context.restore();
        }
        var majorTickMarkLength = 0;
        var majorTickMarkRange = this.rangeForTickMarkStyle(this.style.majorTickMarkStyle, this.style.majorTickMarkLength, x);
        if (this.style.majorTickMarkStyle !== CHAxisStyle.TickMarkStyle.none){
            majorTickMarkLength = this.style.majorTickMarkLength;
            context.save();
            context.setStrokeColor(this.style.majorTickMarkColor);
            context.setLineWidth(this.style.majorTickMarkWidth);
            context.beginPath();
            for (i = 0, l = majorPositions.length; i < l; ++i){
                y = majorPositions[i];
                context.moveToPoint(majorTickMarkRange.location, y);
                context.addLineToPoint(majorTickMarkRange.end, y);
            }
            context.strokePath();
            context.restore();
        }

        // line
        if (this.style.lineWidth > 0){
            context.setStrokeColor(this.style.lineColor);
            context.setLineWidth(this.style.lineWidth);
            context.moveToPoint(x, rect.origin.y);
            context.addLineToPoint(x, rect.origin.y + rect.size.height);
            context.strokePath();
        }

        // labels
        if (this.style.showsLabels){
            var labels = this.getMajorLabels();
            var labelInsets = JSInsets(this.style.labelInsets);
            var labelTextFrame;
            if (this.edge === CHAxis.Edge.leading){
                this.framesetter.attributes.textAlignment = JSTextAlignment.right;
                labelInsets.right += Math.max(this.style.lineWidth / 2, majorTickMarkLength, minorTickMarkLength);
            }else{
                this.framesetter.attributes.textAlignment = JSTextAlignment.left;
                labelInsets.left += Math.max(this.style.lineWidth / 2, majorTickMarkLength, minorTickMarkLength);
            }
            var maxLabelSize = JSSize(rect.size.width - this.style.labelInsets.width, 0);
            var labelOrigin = JSPoint(rect.origin.x + this.style.labelInsets.left, 0);
            for (i = 0, l = labels.length; i < l; ++i){
                if (labels[i] !== null && labels[i] !== undefined && labels[i] !== ""){
                    this.framesetter.attributedString = JSAttributedString.initWithString(labels[i], {
                        font: this.style.labelFont,
                        textColor: this.style.labelTextColor
                    });
                    labelTextFrame = this.framesetter.createFrame(maxLabelSize, JSRange(0, labels[i].length), 1);
                    labelOrigin.y = majorPositions[i] - labelTextFrame.size.height / 2;
                    if (this.style.labelPosition === CHAxisStyle.LabelPosition.betweenTickMarks){
                        labelOrigin.y += (majorPositions[i + 1] - majorPositions[i]) / 2;
                    }
                    labelTextFrame.drawInContextAtPoint(context, labelOrigin);
                }
            }
        }

        context.restore();
    },

    getMajorPositions: function(x0, x1){
        return [];
    },

    getMinorPositions: function(x0, x1){
        return [];
    },

    getMajorLabels: function(){
        return [];
    },

    rangeForTickMarkStyle: function(tickMarkStyle, tickMarkLength, x){
        var halfLength = tickMarkLength / 2;
        if (this.edge === CHAxis.Edge.trailing){
            switch (tickMarkStyle){
                case CHAxisStyle.TickMarkStyle.inside:
                    return JSRange(x - halfLength, halfLength);
                case CHAxisStyle.TickMarkStyle.outside:
                    return JSRange(x, halfLength);
                case CHAxisStyle.TickMarkStyle.centered:
                    return JSRange(x - halfLength, tickMarkLength);
            }
        }else{
            switch (tickMarkStyle){
                case CHAxisStyle.TickMarkStyle.inside:
                    return JSRange(x, halfLength);
                case CHAxisStyle.TickMarkStyle.outside:
                    return JSRange(x - halfLength, halfLength);
                case CHAxisStyle.TickMarkStyle.centered:
                    return JSRange(x - halfLength, tickMarkLength);
            }
        }
        return JSRange.Zero;
    }

});

CHAxis.Direction = {
    horizontal: 0,
    vertical: 1
};

CHAxis.Edge = {
    leading: 0,
    trailing: 1
};
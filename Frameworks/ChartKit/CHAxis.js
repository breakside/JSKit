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
"use strict";

JSClass("CHAxis", JSObject, {

    init: function(){
        this.lineWidth = 1;
        this.labelFont = JSFont.systemFontOfSize(JSFont.Size.normal);
        this.labelInsets = JSInsets(5, 5);
        this.framesetter = JSTextFramesetter.init();
    },

    direction: 0,
    edge: 0,
    name: null,
    lineWidth: 1,
    lineColor: JSColor.black,

    showsLabels: true,
    labelFont: null,
    labelTextColor: JSColor.black,
    labelAngle: 0,
    labelInsets: null,

    majorTickMarkStyle: 0,
    majorTickMarkLength: 5,
    majorTickMarkWidth: 1,
    majorTickMarkColor: JSColor.black,

    minorTickMarkStyle: 0,
    minorTickMarkLength: 3,
    minorTickMarkWidth: 1,
    minorTickMarkColor: JSColor.black,

    majorGridlineColor: JSColor.initWithWhite(0.67),
    majorGridlineWidth: 0,
    majorGridlineDashLengths: null,

    minorGridlineColor: JSColor.initWithWhite(0.8),
    minorGridlineWidth: 0,
    minorGridlineDashLengths: null,

    sizeThatFitsSize: function(maxSize){
        var size = JSSize.Zero;
        var labelSize = JSSize.Zero;
        if (this.showsLabels){
            labelSize = this.sizeOfLargestLabel();
            // TODO: consider effect of label angle
            labelSize.width += this.labelInsets.width;
            labelSize.height += this.labelInsets.height;
        }
        var majorTickMarkLength = this.majorTickMarkStyle !== CHAxis.TickMarkStyle.none ? this.majorTickMarkLength : 0;
        var minorTickMarkLength = this.minorTickMarkStyle !== CHAxis.TickMarkStyle.none ? this.minorTickMarkLength : 0;
        if (this.direction === CHAxis.Direction.horizontal){
            size.width = maxSize.width;
            size.height += Math.max(this.lineWidth / 2, majorTickMarkLength, minorTickMarkLength);
            size.height += labelSize.height;
        }else{
            size.height = maxSize.height;
            size.width += Math.max(this.lineWidth / 2, majorTickMarkLength, minorTickMarkLength);
            size.width += labelSize.width;
        }
        return size;
    },

    sizeOfLargestLabel: function(){
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
        if (this.minorGridlineWidth > 0){
            context.save();
            context.setStrokeColor(this.minorGridlineColor);
            context.setLineWidth(this.minorGridlineWidth);
            if (this.minorGridlineDashLengths !== null){
                context.setLineDash(0, this.minorGridlineDashLengths);
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
        if (this.majorGridlineWidth > 0){
            context.save();
            context.setStrokeColor(this.majorGridlineColor);
            context.setLineWidth(this.majorGridlineWidth);
            if (this.majorGridlineDashLengths !== null){
                context.setLineDash(0, this.majorGridlineDashLengths);
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
        var minorTickMarkRange = this.rangeForTickMarkStyle(this.minorTickMarkStyle, this.minorTickMarkLength, y);
        if (this.minorTickMarkStyle !== CHAxis.TickMarkStyle.none){
            minorTickMarkLength = this.minorTickMarkLength;
            context.save();
            context.setStrokeColor(this.minorTickMarkColor);
            context.setLineWidth(this.minorTickMarkWidth);
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
        var majorTickMarkRange = this.rangeForTickMarkStyle(this.majorTickMarkStyle, this.majorTickMarkLength, y);
        if (this.majorTickMarkStyle !== CHAxis.TickMarkStyle.none){
            majorTickMarkLength = this.majorTickMarkLength;
            context.save();
            context.setStrokeColor(this.majorTickMarkColor);
            context.setLineWidth(this.majorTickMarkWidth);
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
        if (this.lineWidth > 0){
            context.setStrokeColor(this.lineColor);
            context.setLineWidth(this.lineWidth);
            context.moveToPoint(rect.origin.x, y);
            context.addLineToPoint(rect.origin.x + rect.size.width, y);
            context.strokePath();
        }

        // labels
        if (this.showsLabels){
            var labels = this.getMajorLabels();
            var maxLabelSize = JSSize(0, 0);
            var labelTextFrame;
            this.framesetter.attributes.textAlignment = JSTextAlignment.left;
            for (i = 0, l = labels.length; i < l; ++i){
                this.framesetter.attributedString = JSAttributedString.initWithString(labels[i], {
                    font: this.labelFont,
                    textColor: this.labelTextColor
                });
                labelTextFrame = this.framesetter.createFrame(maxLabelSize, JSRange(0, labels[i].length), 1);
                labelTextFrame.drawInContextAtPoint(context, JSPoint(
                    majorPositions[i] - labelTextFrame.size.width / 2,
                    rect.origin.y + this.labelInsets.top + Math.max(this.lineWidth / 2, majorTickMarkLength, minorTickMarkLength)
                ));
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
        if (this.minorGridlineWidth > 0){
            context.save();
            context.setStrokeColor(this.minorGridlineColor);
            context.setLineWidth(this.minorGridlineWidth);
            if (this.minorGridlineDashLengths !== null){
                context.setLineDash(0, this.minorGridlineDashLengths);
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
        if (this.majorGridlineWidth > 0){
            context.save();
            context.setStrokeColor(this.majorGridlineColor);
            context.setLineWidth(this.majorGridlineWidth);
            if (this.majorGridlineDashLengths !== null){
                context.setLineDash(0, this.majorGridlineDashLengths);
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
        var minorTickMarkRange = this.rangeForTickMarkStyle(this.minorTickMarkStyle, this.minorTickMarkLength, x);
        if (this.minorTickMarkStyle !== CHAxis.TickMarkStyle.none){
            minorTickMarkLength = this.minorTickMarkLength;
            context.save();
            context.setStrokeColor(this.minorTickMarkColor);
            context.setLineWidth(this.minorTickMarkWidth);
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
        var majorTickMarkRange = this.rangeForTickMarkStyle(this.majorTickMarkStyle, this.majorTickMarkLength, x);
        if (this.majorTickMarkStyle !== CHAxis.TickMarkStyle.none){
            majorTickMarkLength = this.majorTickMarkLength;
            context.save();
            context.setStrokeColor(this.majorTickMarkColor);
            context.setLineWidth(this.majorTickMarkWidth);
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
        if (this.lineWidth > 0){
            context.setStrokeColor(this.lineColor);
            context.setLineWidth(this.lineWidth);
            context.moveToPoint(x, rect.origin.y);
            context.addLineToPoint(x, rect.origin.y + rect.size.height);
            context.strokePath();
        }

        // labels
        if (this.showsLabels){
            var labels = this.getMajorLabels();
            var maxLabelSize = JSSize(rect.size.width - this.labelInsets.width - Math.max(this.lineWidth / 2, majorTickMarkLength, minorTickMarkLength), 0);
            var labelTextFrame;
            this.framesetter.attributes.textAlignment = JSTextAlignment.right;
            for (i = 0, l = labels.length; i < l; ++i){
                this.framesetter.attributedString = JSAttributedString.initWithString(labels[i], {
                    font: this.labelFont,
                    textColor: this.labelTextColor
                });
                labelTextFrame = this.framesetter.createFrame(maxLabelSize, JSRange(0, labels[i].length), 1);
                labelTextFrame.drawInContextAtPoint(context, JSPoint(
                    rect.origin.x + this.labelInsets.left,
                    majorPositions[i] - labelTextFrame.size.height / 2
                ));
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
                case CHAxis.TickMarkStyle.inside:
                    return JSRange(x - halfLength, halfLength);
                case CHAxis.TickMarkStyle.outside:
                    return JSRange(x, halfLength);
                case CHAxis.TickMarkStyle.centered:
                    return JSRange(x - halfLength, tickMarkLength);
            }
        }else{
            switch (tickMarkStyle){
                case CHAxis.TickMarkStyle.inside:
                    return JSRange(x, halfLength);
                case CHAxis.TickMarkStyle.outside:
                    return JSRange(x - halfLength, halfLength);
                case CHAxis.TickMarkStyle.centered:
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

CHAxis.TickMarkStyle = {
    none: 0,
    inside: 1,
    outside: 2,
    centered: 3
};
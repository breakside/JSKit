// Copyright 2020 Breakside Inc.
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

// #import "JSObject.js"
// #import "JSCubicBezier.js"
/* global JSContext */
'use strict';

(function(){

JSClass("JSPath", JSObject, {

    init: function(){
        this.subpaths = [];
        this._currentPoint = JSPoint.Zero;
    },

    copy: function(){
        var copy = JSPath.init();
        copy.subpaths = [];
        for (var i = 0, l = this.subpaths.length; i < l; ++i){
            copy.subpaths.push(this.subpaths[i].copy());
        }
        if (this.currentSubpath !== null){
            copy.currentSubpath = copy.subpaths[copy.subpaths.length - 1];
        }
        copy._currentPoint = JSPoint(this._currentPoint);
        return copy;
    },

    empty: JSReadOnlyProperty(undefined, undefined, 'isEmpty'),

    isEmpty: function(){
        var subpath;
        for (var i = 0, l = this.subpaths.length; i < l; ++i){
            subpath = this.subpaths[i];
            if (subpath.segments.length > 0 || subpath.closed){
                return false;
            }
        }
        return true;
    },

    subpaths: null,
    currentPoint: JSReadOnlyProperty('_currentPoint', null),
    currentSubpath: null,
    boundingRect: JSDynamicProperty('_boundingRect', null),

    moveToPoint: function(point, transform){
        if (transform !== undefined){
            point = transform.convertPointFromTransform(point);
        }else{
            point = JSPoint(point);
        }
        this.currentSubpath = new Subpath(point);
        this.subpaths.push(this.currentSubpath);
        this._currentPoint = point;
        this._invalidateBoundingRect();
    },

    addLineToPoint: function(point, transform){
        if (transform !== undefined){
            point = transform.convertPointFromTransform(point);
        }else{
            point = JSPoint(point);
        }
        this._createSubpathIfNeeded();
        this.currentSubpath.segments.push({type: JSPath.SegmentType.line, end: point});
        this._currentPoint = point;
        this._invalidateBoundingRect();
    },

    addCurveToPoint: function(point, control1, control2, transform){
        if (transform !== undefined){
            point = transform.convertPointFromTransform(point);
            control1 = transform.convertPointFromTransform(control1);
            control2 = transform.convertPointFromTransform(control2);
        }
        this._createSubpathIfNeeded();
        var curve = JSCubicBezier(this._currentPoint, control1, control2, point);
        this.currentSubpath.segments.push({type: JSPath.SegmentType.curve, curve: curve});
        this._currentPoint = point;
        this._invalidateBoundingRect();
    },

    addRect: function(rect, transform){
        var p1 = rect.origin;
        var p2 = rect.origin.adding(JSPoint(rect.size.width, 0));
        var p3 = rect.origin.adding(JSPoint(rect.size.width, rect.size.height));
        var p4 = rect.origin.adding(JSPoint(0, rect.size.height));
        this.moveToPoint(p1, transform);
        this.addLineToPoint(p2, transform);
        this.addLineToPoint(p3, transform);
        this.addLineToPoint(p4, transform);
        this.closeSubpath();
    },

    addRoundedRect: function(rect, cornerRadius, transform){
        if (cornerRadius <= 0){
            this.addRect(rect);
            return;
        }
        var halfWidth = rect.size.width / 2;
        var halfHeight = rect.size.height / 2;
        if (cornerRadius > halfWidth){
            cornerRadius = halfWidth;
        }
        if (cornerRadius > halfHeight){
            cornerRadius = halfHeight;
        }
        var magicRadius = JSPath.ellipseCurveMagic * cornerRadius;

        var p1 = JSPoint(rect.origin.x, rect.origin.y + cornerRadius);
        var p2 = JSPoint(rect.origin.x + cornerRadius, rect.origin.y);
        var cp1 = JSPoint(p1.x, p1.y - magicRadius);
        var cp2 = JSPoint(p2.x - magicRadius, p2.y);
        this.moveToPoint(p1, transform);
        this.addCurveToPoint(p2, cp1, cp2, transform);

        p1 = JSPoint(rect.origin.x + rect.size.width - cornerRadius, rect.origin.y);
        p2 = JSPoint(rect.origin.x + rect.size.width, rect.origin.y + cornerRadius);
        cp1 = JSPoint(p1.x + magicRadius, p1.y);
        cp2 = JSPoint(p2.x, p2.y - magicRadius);
        this.addLineToPoint(p1, transform);
        this.addCurveToPoint(p2, cp1, cp2, transform);

        p1 = JSPoint(rect.origin.x + rect.size.width, rect.origin.y + rect.size.height - cornerRadius);
        p2 = JSPoint(rect.origin.x + rect.size.width - cornerRadius, rect.origin.y + rect.size.height);
        cp1 = JSPoint(p1.x, p1.y + magicRadius);
        cp2 = JSPoint(p2.x + magicRadius, p2.y);
        this.addLineToPoint(p1, transform);
        this.addCurveToPoint(p2, cp1, cp2, transform);

        p1 = JSPoint(rect.origin.x + cornerRadius, rect.origin.y + rect.size.height);
        p2 = JSPoint(rect.origin.x, rect.origin.y + rect.size.height - cornerRadius);
        cp1 = JSPoint(p1.x - magicRadius, p1.y);
        cp2 = JSPoint(p2.x, p2.y + magicRadius);
        this.addLineToPoint(p1, transform);
        this.addCurveToPoint(p2, cp1, cp2, transform);

        this.closeSubpath();
    },

    addEllipseInRect: function(rect, transform){
        var halfWidth = rect.size.width / 2.0;
        var halfHeight = rect.size.height / 2.0;
        var magic = JSPath.ellipseCurveMagic;
        var magicWidth = magic * halfWidth;
        var magicHeight = magic * halfHeight;
        var p1 = JSPoint(rect.origin.x + halfWidth, rect.origin.y);
        var p2 = JSPoint(rect.origin.x + rect.size.width, rect.origin.y + halfHeight);
        var p3 = JSPoint(rect.origin.x + halfWidth, rect.origin.y + rect.size.height);
        var p4 = JSPoint(rect.origin.x, rect.origin.y + halfHeight);
        var cp1 = JSPoint(p1.x + magicWidth, p1.y);
        var cp2 = JSPoint(p2.x, p2.y - magicHeight);
        var cp3 = JSPoint(p2.x, p2.y + magicHeight);
        var cp4 = JSPoint(p3.x + magicWidth, p3.y);
        var cp5 = JSPoint(p3.x - magicWidth, p3.y);
        var cp6 = JSPoint(p4.x, p4.y + magicHeight);
        var cp7 = JSPoint(p4.x, p4.y - magicHeight);
        var cp8 = JSPoint(p1.x - magicWidth, p1.y);
        this.moveToPoint(p1, transform);
        this.addCurveToPoint(p2, cp1, cp2, transform);
        this.addCurveToPoint(p3, cp3, cp4, transform);
        this.addCurveToPoint(p4, cp5, cp6, transform);
        this.addCurveToPoint(p1, cp7, cp8, transform);
        this.closeSubpath();
    },

    addArc: function(center, radius, startAngle, endAngle, clockwise, transform){
        if (radius < 0){
            throw new Error("Negative radius not allowed in addArc");
        }

        // Start by either moving to or drawing a line to the starting ponit of the arc
        var p1 = JSPoint(center.x + radius * Math.cos(startAngle), center.y + radius * Math.sin(startAngle));
        if (this.subpaths.length === 0){
            this.moveToPoint(p1, transform);
        }else{
            this.addLineToPoint(p1, transform);
        }

        // If there's no radius, then there's nothing left to do
        if (radius === 0){
            return;
        }

        // Figure out how much of an angle we're going to draw
        var direction = clockwise ? 1 : -1;
        var sweep = direction * (endAngle - startAngle);

        // If the sweep is against the specified direction (negative), adjust it to be
        // the corresponding positive angle.  Note that a counter-direction
        // sweep can never result in an etire circle.
        while (sweep <= 0){
            sweep += TWO_PI;
        }

        // If the sweep is more than a complete circle, just make it a
        // complete circle since any more will overdraw.
        if (sweep > TWO_PI){
            sweep = TWO_PI;
        }

        // The arc points much easier to express in unit-circle coordinates,
        // so we'll make a transform that can convert from unit-circle coordinates
        // to our coordinates.  Note that we could instead encode the transform
        // directly into the context, but that would generate more instructions
        // (in a case such as PDF) and require the reader to do more calculations
        // on its end.
        var transform2 = JSAffineTransform.Identity;
        transform2 = transform2.translatedBy(center.x, center.y);
        transform2 = transform2.scaledBy(radius, radius);
        transform2 = transform2.rotatedBy(startAngle);
        var p2;
        var c1;
        var c2;

        // Our arc algorithm handles angles less than 90 degrees.  For sweeps
        // greater than 90 degrees, we can do quarter-circles at a time using
        // the ellipse magic number until we're left with only a sweep less than 90.
        while (sweep >= HALF_PI){
            p2 = JSPoint(0, direction);
            c1 = JSPoint(1, direction * JSPath.ellipseCurveMagic);
            c2 = JSPoint(JSPath.ellipseCurveMagic, direction);
            this.addCurveToPoint(transform2.convertPointFromTransform(p2), transform2.convertPointFromTransform(c1), transform2.convertPointFromTransform(c2), transform);
            transform2 = transform2.rotatedBy(direction * HALF_PI);
            sweep -= HALF_PI;
        }

        // If there's any < 90 degree sweep remaining, use the arc-specific
        // curve derivation.
        if (sweep > 0){
            // Derviation at https://www.tinaja.com/glib/bezcirc2.pdf
            transform2 = transform2.rotatedBy(direction * sweep / 2);
            p2 = JSPoint(Math.cos(sweep / 2), direction * Math.sin(sweep / 2));
            c2 = JSPoint((4 - p2.x) / 3, ((1 - p2.x) * (3 - p2.x)) / (3 * p2.y));
            c1 = JSPoint(c2.x, -c2.y);
            this.addCurveToPoint(transform2.convertPointFromTransform(p2), transform2.convertPointFromTransform(c1), transform2.convertPointFromTransform(c2), transform);
        }
    },

    addArcUsingTangents: function(tangent1End, tangent2End, radius, transform){
        // Bail if the raduis is negative
        if (radius <= 0){
            throw new Error("Negative radius not allowed in addArcUsingTangents");
        }

        // The tangent line logic expects there to be a starting point on the current subpath.
        // If there isn't one, add one at the first point given.
        // Note: this will cause an early exit because p0 and p1 will be the same
        // and making an arc requires three unique points in order to figure two
        // tangent lines.
        if (this.subpaths.length === 0){
            this.moveToPoint(tangent1End, transform);
        }

        // Setup our three main points that create two interescting tangent lines
        var p0 = transform ? transform.convertPointToTransform(this._currentPoint) : JSPoint(this._currentPoint);
        var p1 = JSPoint(tangent1End);
        var p2 = JSPoint(tangent2End);

        // If there's no radius, or if any two points are equal, we don't have
        // enough information to make an arc, so just make line to p1 and stop
        if (radius === 0 || p0.isEqual(p1) || p1.isEqual(p2)){
            this.addLineToPoint(p1);
            return;
        }

        // Setup a couple vectors representing our two line directions
        var v1 = JSPoint(p1.x - p0.x, p1.y - p0.y);
        var v2 = JSPoint(p1.x - p2.x, p1.y - p2.y);

        // Use the vectors to figure slope and intercepts of our lines.
        // If all points are on the same line, the two slopes and intercepts
        // will be equivalent.  In this case, there's no angle in which to place
        // the circle/arc.  So just make a line to p1 and stop.
        var slope1 = v1.y / v1.x;
        var slope2 = v2.y / v2.x;
        var intercept1 = p1.y - p1.x * slope1;
        var intercept2 = p1.y - p1.x * slope2;
        if (slope1 == slope2 && intercept1 == intercept2){
            this.addLineToPoint(p1);
            return;
        }

        // Figure out starting and ending angles, making them both positive for
        // uniformity.
        var a1 = Math.atan(slope1);
        if (a1 < 0){
            a1 += TWO_PI;
        }
        var a2 = Math.atan(slope2);
        if (a2 < 0){
            a2 += TWO_PI;
        }

        // By definition, the circle we draw will have a center that is exactly half way
        // through the angle formed by our tangent lines.  The angle can be found with a little
        // vector math (the dot product of the two vectors divided by the product of their magnitues
        // equals the cosine of the angle).
        var angleAtP1 = Math.acos((v1.x * v2.x + v1.y * v2.y) / (Math.sqrt(v1.x * v1.x + v1.y * v1.y) * Math.sqrt(v2.x * v2.x + v2.y * v2.y)));

        // Once we know the angle, we know there's a right triangle formed by p1, center, and either
        // tangent point.  Since we know the radius, simple trig
        var distanceFromP1ToCenter = radius / Math.sin(angleAtP1 / 2);
        var distanceFromP1ToEitherT = distanceFromP1ToCenter * Math.cos(angleAtP1 / 2);

        // Figure the tangent points and center point of the circle.
        // Because we started with an atan() call, which can't tell the difference between
        // mirrored angles, we do a check to see which side of p1 we're on, and add 180 degrees
        // if necesary.  Also, figure the start and end angles by adding or subtracting 90 degrees
        // from the tangent lines, again considering which way things are actually oriented.
        var t1, t2;
        if (p1.x >= p0.x){
            t1 = JSPoint(p1.x - distanceFromP1ToEitherT * Math.cos(a1), p1.y - distanceFromP1ToEitherT * Math.sin(a1));
        }else{
            t1 = JSPoint(p1.x - distanceFromP1ToEitherT * Math.cos(a1 + Math.PI), p1.y - distanceFromP1ToEitherT * Math.sin(a1 + Math.PI));
        }
        if (p1.x >= p2.x){
            t2 = JSPoint(p1.x - distanceFromP1ToEitherT * Math.cos(a2), p1.y - distanceFromP1ToEitherT * Math.sin(a2));
        }else{
            t2 = JSPoint(p1.x - distanceFromP1ToEitherT * Math.cos(a2 + Math.PI), p1.y - distanceFromP1ToEitherT * Math.sin(a2 + Math.PI));
        }

        // Figure the center point
        var center11, center12, center21, center22;
        center11 = JSPoint(t1.x + radius * Math.cos(a1 + HALF_PI), t1.y + radius * Math.sin(a1 + HALF_PI));
        center12 = JSPoint(t1.x + radius * Math.cos(a1 - HALF_PI), t1.y + radius * Math.sin(a1 - HALF_PI));
        center21 = JSPoint(t2.x + radius * Math.cos(a2 + HALF_PI), t2.y + radius * Math.sin(a2 + HALF_PI));
        center22 = JSPoint(t2.x + radius * Math.cos(a2 - HALF_PI), t2.y + radius * Math.sin(a2 - HALF_PI));

        var center, startAngle, endAngle;
        var min = center11.distanceToPoint(center21);
        center = center11;
        startAngle = a1 - HALF_PI;
        endAngle = a2 - HALF_PI;
        var d = center12.distanceToPoint(center21);
        if (d < min){
            min = d;
            center = center12;
            startAngle = a1 + HALF_PI;
            endAngle = a2 - HALF_PI;
        }
        d = center11.distanceToPoint(center22);
        if (d < min){
            min = d;
            center = center11;
            startAngle = a1 - HALF_PI;
            endAngle = a2 + HALF_PI;
        }
        d = center12.distanceToPoint(center22);
        if (d < min){
            min = d;
            center = center12;
            startAngle = a1 + HALF_PI;
            endAngle = a2 + HALF_PI;
        }

        // Adjust our start and end angles and figure out if the shortest
        // distance is clockwise or counter clockwise.
        // Note: we could swap the angles and always arc in a fixed direction,
        // but I think it makes more sense to always arc from p0 to p2.
        if (startAngle < 0){
            startAngle += TWO_PI;
        }
        if (endAngle < 0){
            endAngle += TWO_PI;
        }
        var clockwise;
        if (startAngle > endAngle){
            clockwise = startAngle - endAngle >= Math.PI;
        }else{
            clockwise = endAngle - startAngle <= Math.PI;
        }
        this.moveToPoint(t1);
        this.addArc(center, radius, startAngle, endAngle, clockwise);
    },

    closeSubpath: function(){
        if (this.currentSubpath !== null){
            this._currentPoint = this.currentSubpath.firstPoint;
            this.currentSubpath.closed = true;
            this.currentSubpath = null;
        }
    },

    // TODO: convert to dashed outlines

    pathThatFillsStroke: function(lineWidth, lineCap, lineJoin, miterLimit, transform){
        var i, l;
        var subpath;
        for (i = 0, l = this.subpaths.length; i < l; ++i){
            subpath = this.subpaths[i];
            if (subpath.segments.length === 0){
                if (subpath.closed){
                    var segment = subpath.segments[0];
                    var radius = lineWidth / 2;
                    var rect = JSRect(segment.firstPoint.subtracting(JSPoint(radius, radius)), JSSize(lineWidth, lineWidth));
                    if (lineCap === JSContext.LineCap.round){
                        this.addEllipseInRect(rect, transform);
                    }else if (lineCap === JSContext.LineCap.square){
                        this.addRect(rect, transform);
                    }
                }
                break;
            }
            // TODO:
        }
    },

    containsPoint: function(point, fillRule, transform){
        // To determine if a point is within a path, we can make a line that starts
        // from the point and goes to infinity in any direction, and then count the
        // number of times our line crosses a path segment.
        //
        // For simplicity, we'll choose a line that starts at the point and goes
        // vertical to Infinity (straight down).
        //
        // For the winding fill rule, we count the number of times a crossing
        // segment goes left to right and subtract the number of times a crosssing
        // segment goes right to left.  If the result is non-zero, we're inside.
        //
        // For the even-odd fill rule, we're inside if the total number of
        // crossings is odd, and outside if it's even.
        if (fillRule === undefined){
            fillRule = JSContext.FillRule.winding;
        }
        if (transform){
            point = transform.convertPointFromTransform(point);
        }
        var ltr = 0;
        var rtl = 0;
        var i, l;
        var j, k;
        var subpath;
        var segment;
        var pointBeforeLast;
        var lastPoint;
        var lastDirection;
        var check;

        // return 0 for no cross
        // return 1 for left-to-right cross
        // return -1 for right-to-left cross
        // return 2 for on segment
        var checkLine = function(start, end, previous){
            // vertical line
            if (start.x == end.x){
                // ...are we on it?
                if (point.x == start.x){
                    if (start.y <= end.y){
                        if (point.y >= start.y && point.y <= end.y){
                            return 2;
                        }
                        return 0;
                    }
                    if (point.y >= end.y && point.y <= start.y){
                        return 2;
                    }
                    return 0;
                }
                return 0;
            }

            // figure out where the line's y value is at our x value
            var slope = (end.y - start.y) / (end.x - start.x);
            var y = start.y + (point.x - start.x) * slope;
            var dy = y - point.y;

            // on the line (within a tiny tolerance for float erros)
            if (Math.abs(dy) < 0.0000000001){
                // left to right (including endpoints)
                if (start.x < end.x){
                    if (point.x >= start.x && point.x <= end.x){
                        return 2;
                    }
                    return 0;
                }

                // right to left (including endpoints)
                if (point.x >= end.x && point.x <= start.x){
                    return 2;
                }
                return 0;
            }

            // no cross
            if (dy < 0){
                return 0;
            }

            // left to right
            if (start.x < end.x){
                if (!previous || previous.x < start.x){
                    // if we're moving the same direction as the previous segment
                    // don't double count the starting point
                    if (point.x > start.x && point.x <= end.x){
                        return 1;
                    }
                    return 0;
                }
                if (point.x >= start.x && point.x <= end.x){
                    return 1;
                }
                return 0;
            }

            // right to left
            if (!previous || previous.x > start.x){
                // if we're moving int he same direction as the previous segment
                // don't double count the starting point
                if (point.x < start.x && point.x >= end.x){
                    return -1;
                }
                return 0;
            }
            if (point.x <= start.x && point.x >= end.x){
                return -1;
            }
            return 0;
        };

        for (i = 0, l = this.subpaths.length; i < l; ++i){
            subpath = this.subpaths[i];
            lastPoint = subpath.firstPoint;
            pointBeforeLast = null;
            for (j = 0, k  = subpath.segments.length; j < k; ++j){
                segment = subpath.segments[j];
                if (segment.type === JSPath.SegmentType.line){
                    check = checkLine(lastPoint, segment.end, pointBeforeLast);
                    if (check === 2){
                        return true;
                    }
                    if (check === 1){
                        ++ltr;
                    }else if (check === -1){
                        ++rtl;
                    }
                    pointBeforeLast = lastPoint;
                    lastPoint = segment.end;
                }else if (segment.type === JSPath.SegmentType.curve){
                    var t = segment.curve.intervalsForX(point.x);
                    var p1;
                    var p2;
                    var p3;
                    if (t.length > 0){
                        if (t[0] < 1){
                            p1 = segment.curve.pointAtInterval(t[0]);
                            if (p1.y == point.y){
                                return true;
                            }
                            if (p1.y > point.y){
                                p2 = segment.curve.pointAtInterval(t[0] - 0.01);
                                p3 = segment.curve.pointAtInterval(t[0] + 0.01);
                                if (p3.x > p1.x && p1.x > p2.x){
                                    ++ltr;
                                }else if (p3.x < p1.x && p1.x < p2.x){
                                    ++rtl;
                                }else{
                                    // switching directions, don't care/cancels out
                                }
                            }
                        }
                        if (t.length > 1){
                            if (t[1] < 1){
                                p1 = segment.curve.pointAtInterval(t[1]);
                                if (p1.y == point.y){
                                    return true;
                                }
                                if (p1.y > point.y){
                                    p2 = segment.curve.pointAtInterval(t[1] - 0.01);
                                    p3 = segment.curve.pointAtInterval(t[1] + 0.01);
                                    if (p3.x > p1.x && p1.x > p2.x){
                                        ++ltr;
                                    }else if (p3.x < p1.x && p1.x < p2.x){
                                        ++rtl;
                                    }
                                }
                            }
                            if (t.length > 2){
                                if (t[2] < 1){
                                    p1 = segment.curve.pointAtInterval(t[2]);
                                    if (p1.y == point.y){
                                        return true;
                                    }
                                    if (p1.y > point.y){
                                        p2 = segment.curve.pointAtInterval(t[2] - 0.01);
                                        p3 = segment.curve.pointAtInterval(t[2] + 0.01);
                                        if (p3.x > p1.x && p1.x > p2.x){
                                            ++ltr;
                                        }else if (p3.x < p1.x && p1.x < p2.x){
                                            ++rtl;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    pointBeforeLast = segment.curve.cp2;
                    lastPoint = segment.curve.p2;
                }
            }

            // Don't forget the straight line back to the first point of the subpath,
            // even if the subpath isn't closed, there's such an imaginary line for the
            // purposes of determining what is in or out of the path
            check = checkLine(lastPoint, subpath.firstPoint, pointBeforeLast);
            if (check === 2){
                return true;
            }
            if (check === 1){
                ++ltr;
            }else if (check === -1){
                ++rtl;
            }
        }
        if (fillRule === JSContext.FillRule.winding){
            return ltr - rtl !== 0;
        }
        return (ltr + rtl) % 2 !== 0;
    },

    _createSubpathIfNeeded: function(){
        if (this.currentSubpath === null){
            this.currentSubpath = new Subpath(this._currentPoint);
            this.subpaths.push(this.currentSubpath);
        }
    },

    _invalidateBoundingRect: function(){
        this._boundingRect = null;
    },

    getBoundingRect: function(){
        if (this._boundingRect === null){
            this._boundingRect = this._calculateBoundingRect();
        }
        return this._boundingRect;
    },

    _calculateBoundingRect: function(){
        var min = null;
        var max = null;
        var includePoint = function(point){
            if (min === null){
                min = JSPoint(point);
                max = JSPoint(point);
            }else{
                if (point.x < min.x){
                    min.x = point.x;
                }
                if (point.x > max.x){
                    max.x = point.x;
                }
                if (point.y < min.y){
                    min.y = point.y;
                }
                if (point.y > max.y){
                    max.y = point.y;
                }
            }
        };
        var i, l;
        var j, k;
        var x, y;
        var subpath;
        var segment;
        for (i = 0, l = this.subpaths.length; i < l; ++i){
            subpath = this.subpaths[i];
            includePoint(subpath.firstPoint);
            for (j = 0, k = subpath.segments.length; j < k; ++j){
                segment = subpath.segments[j];
                if (segment.type == JSPath.SegmentType.line){
                    includePoint(segment.end);
                }else if (segment.type == JSPath.SegmentType.curve){
                    var boundingPoints = segment.curve.boundingPoints();
                    for (x = 0, y = boundingPoints.length; x < y; ++x){
                        includePoint(boundingPoints[x]);
                    }
                }
            }
        }
        if (min === null){
            return null;
        }
        return JSRect(min, JSSize(max.x - min.x, max.y - min.y));
    }

});

var Subpath = function(firstPoint){
    if (this === undefined){
        return new Subpath(firstPoint);
    }
    this.firstPoint = firstPoint;
    this.closed = false;
    this.segments = [];
};

Subpath.prototype = {
    copy: function(){
        var copy = new Subpath(this.firstPoint);
        copy.segments = JSCopy(this.segments);
        copy.closed = this.closed;
        return copy;
    }
};

JSPath.SegmentType = {
    line: "line",
    curve: "curve",
};

var TWO_PI = Math.PI * 2;
var HALF_PI = Math.PI / 2;

// percentage between two points where a bezier control point should be placed
// in order to best approximate an ellipse, or circle in the ideal case.
// Derivation at https://www.tinaja.com/glib/ellipse4.pdf
JSPath.ellipseCurveMagic = 0.551784;

})();
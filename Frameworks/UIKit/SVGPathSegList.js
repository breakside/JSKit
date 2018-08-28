/* global JSGlobalObject, SVGPathSegList, SVGPathSeg, SVGPathSegClosePath, SVGPathSegMovetoAbs, SVGPathSegLinetoAbs, SVGPathElement, SVGPathSegCurvetoCubicAbs, SVGPathSegCurvetoQuadraticAbs, SVGPathSegArcAbs */
'use strict';

(function(g){

if (!g.SVGPathSegList){

    g.SVGPathSegList = function SVGPathSegList(pathElement){
        this.pathElement = pathElement;
        this._items = [];
        this._data = "";
    };

    SVGPathSegList.prototype = Object.create(Function.prototype);

}

if (!('appendItem' in SVGPathSegList.prototype)){
    Object.defineProperties(SVGPathSegList.prototype, {

        appendItem: {
            value: function SVGPathSegList_appendItem(item){
                if (this._data.length > 0){
                    this._data += " ";
                }
                this._items.push(item);
                this._data += item.toString();
                this.pathElement.setAttribute("d", this._data);
            }
        },

        clear: {
            value: function SVGPathSegList_clear(){
                this._data = "";
                this._items = [];
                this.pathElement.setAttribute("d", this._data);
            }
        }

    });

    if ('pathSegList' in SVGPathElement.prototype){

        var originalGetter = Object.getOwnPropertyDescriptor(SVGPathElement.prototype, 'pathSegList').get;

        Object.defineProperties(SVGPathElement.prototype, {

            pathSegList: {
                get: function(){
                    var list = originalGetter.call(this);
                    if (list.pathElement === undefined){
                        list.pathElement = this;
                        list._data = "";
                        list._items = [];
                    }
                    return list;
                }
            },
        });
    }
}

if (!g.SVGPathSeg){

    g.SVGPathSeg = function SVGPathSeg(){
    };

    Object.defineProperties(SVGPathSeg, {
        PATHSEG_UNKNOWN: {value: 0},
        PATHSEG_CLOSEPATH: {value: 1},
        PATHSEG_MOVETO_ABS: {value: 2},
        PATHSEG_MOVETO_REL: {value: 3},
        PATHSEG_LINETO_ABS: {value: 4},
        PATHSEG_LINETO_REL: {value: 5},
        PATHSEG_CURVETO_CUBIC_ABS: {value: 6},
        PATHSEG_CURVETO_CUBIC_REL: {value: 7},
        PATHSEG_CURVETO_QUADRATIC_ABS: {value: 8},
        PATHSEG_CURVETO_QUADRATIC_REL: {value: 9},
        PATHSEG_ARC_ABS: {value: 10},
        PATHSEG_ARC_REL: {value: 11},
        PATHSEG_LINETO_HORIZONTAL_ABS: {value: 12},
        PATHSEG_LINETO_HORIZONTAL_REL: {value: 13},
        PATHSEG_LINETO_VERTICAL_ABS: {value: 14},
        PATHSEG_LINETO_VERTICAL_REL: {value: 15},
        PATHSEG_CURVETO_CUBIC_SMOOTH_ABS: {value: 16},
        PATHSEG_CURVETO_CUBIC_SMOOTH_REL: {value: 17},
        PATHSEG_CURVETO_QUADRATIC_SMOOTH_ABS: {value: 18},
        PATHSEG_CURVETO_QUADRATIC_SMOOTH_REL: {value: 19}
    });

    g.SVGPathSegClosePath = function SVGPathSegClosePath(){
    };

    SVGPathSegClosePath.prototype = Object.create(SVGPathSeg.prototype, {
        pathSegType: {value: SVGPathSeg.PATHSEG_CLOSEPATH},
        pathSegTypeAsLetter: {value: "Z"},
        toString: {
            value: function SVGPathSegClosePath_toString(){
                return this.pathSegTypeAsLetter;
            }
        }
    });

    g.SVGPathSegMovetoAbs = function SVGPathSegMovetoAbs(x, y){
        Object.defineProperties(this, {
            x: {value: x},
            y: {value: y}
        });
    };

    SVGPathSegMovetoAbs.prototype = Object.create(SVGPathSeg.prototype, {
        pathSegType: {value: SVGPathSeg.PATHSEG_MOVETO_ABS},
        pathSegTypeAsLetter: {value: "M"},
        x: {value: 0, configurable: true},
        y: {value: 0, configurable: true},
        toString: {
            value: function SVGPathSegMovetoAbs_toString(){
                return this.pathSegTypeAsLetter + ' ' + this.x + ' ' + this.y;
            }
        }
    });

    g.SVGPathSegLinetoAbs = function SVGPathSegLinetoAbs(x, y){
        Object.defineProperties(this, {
            x: {value: x},
            y: {value: y}
        });
    };

    SVGPathSegLinetoAbs.prototype = Object.create(SVGPathSeg.prototype, {
        pathSegType: {value: SVGPathSeg.PATHSEG_LINETO_ABS},
        pathSegTypeAsLetter: {value: "L"},
        x: {value: 0, configurable: true},
        y: {value: 0, configurable: true},
        toString: {
            value: function SVGPathSegLinetoAbs_toString(){
                return this.pathSegTypeAsLetter + ' ' + this.x + ' ' + this.y;
            }
        }
    });

    g.SVGPathSegArcAbs = function SVGPathSegArcAbs(x, y, r1, r2, angle, largeArcFlag, sweepFlag){
        Object.defineProperties(this, {
            x: {value: x},
            y: {value: y},
            r1: {value: r1},
            r2: {value: r2},
            angle: {value: angle},
            largeArcFlag: {value: largeArcFlag},
            sweepFlag: {value: sweepFlag}
        });
    };

    SVGPathSegArcAbs.prototype = Object.create(SVGPathSeg.prototype, {
        pathSegType: {value: SVGPathSeg.PATHSEG_ARC_ABS},
        pathSegTypeAsLetter: {value: "A"},
        x: {value: 0, configurable: true},
        y: {value: 0, configurable: true},
        r1: {value: 0, configurable: true},
        r2: {value: 0, configurable: true},
        angle: {value: 0, configurable: true},
        largeArcFlag: {value: false, configurable: true},
        sweepFlag: {value: false, configurable: true},
        toString: {
            value: function SVGPathSegArcAbs_toString(){
                return this.pathSegTypeAsLetter + ' ' + this.r1 + ' ' + this.r2 + ' ' + this.angle + ' ' + (this.largeArcFlag ? 1 : 0) + ' ' + (this.sweepFlag ? 1 : 0) + ' ' + this.x + ' ' + this.y;
            }
        }
    });

    g.SVGPathSegCurvetoCubicAbs = function SVGPathSegCurvetoCubicAbs(x, y, x1, y1, x2, y2){
        Object.defineProperties(this, {
            x: {value: x},
            y: {value: y},
            x1: {value: x1},
            y1: {value: y1},
            x2: {value: x2},
            y2: {value: y2}
        });
    };

    SVGPathSegCurvetoCubicAbs.prototype = Object.create(SVGPathSeg.prototype, {
        pathSegType: {value: SVGPathSeg.PATHSEG_CURVETO_CUBIC_ABS},
        pathSegTypeAsLetter: {value: "C"},
        x: {value: 0, configurable: true},
        y: {value: 0, configurable: true},
        x1: {value: 0, configurable: true},
        y1: {value: 0, configurable: true},
        x2: {value: 0, configurable: true},
        y2: {value: 0, configurable: true},
        toString: {
            value: function SVGPathSegCurvetoCubicAbs_toString(){
                return this.pathSegTypeAsLetter + ' ' + this.x1 + ' ' + this.y1 + ' ' + this.x2 + ' ' + this.y2 + ' ' + this.x + ' ' + this.y;
            }
        }
    });

    g.SVGPathSegCurvetoQuadraticAbs = function SVGPathSegCurvetoQuadraticAbs(x, y, x1, y1){
        Object.defineProperties(this, {
            x: {value: x},
            y: {value: y},
            x1: {value: x1},
            y1: {value: y1},
        });
    };

    SVGPathSegCurvetoQuadraticAbs.prototype = Object.create(SVGPathSeg.prototype, {
        pathSegType: {value: SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_ABS},
        pathSegTypeAsLetter: {value: "Q"},
        x: {value: 0, configurable: true},
        y: {value: 0, configurable: true},
        x1: {value: 0, configurable: true},
        y1: {value: 0, configurable: true},
        toString: {
            value: function SVGPathSegCurvetoQuadraticAbs_toString(){
                return this.pathSegTypeAsLetter + ' ' + this.x1 + ' ' + this.y1 + ' ' + this.x + ' ' + this.y;
            }
        }
    });
    

}

if (!('pathSegList' in SVGPathElement.prototype)){

    Object.defineProperties(SVGPathElement.prototype, {

        pathSegList: {
            get: function(){
                if (this._pathSegList === undefined){
                    this._pathSegList = new SVGPathSegList(this);
                }
                return this._pathSegList;
            }
        },
    });
}

if (!('createSVGPathSegMovetoAbs' in SVGPathElement.prototype)){

    Object.defineProperties(SVGPathElement.prototype, {

        createSVGPathSegMovetoAbs: {
            value: function SVGPathElement_createSVGPathSegMovetoAbs(x, y){
                return new SVGPathSegMovetoAbs(x, y);
            }
        },

        createSVGPathSegLinetoAbs: {
            value: function SVGPathElement_createSVGPathSegLinetoAbs(x, y){
                return new SVGPathSegLinetoAbs(x, y);
            }
        },

        createSVGPathSegArcAbs: {
            value: function SVGPathElement_createSVGPathSegArcAbs(x, y, r1, r2, angle, largeArcFlag, sweepFlag){
                return new SVGPathSegArcAbs(x, y, r1, r2, angle, largeArcFlag, sweepFlag);
            }
        },

        createSVGPathSegCurvetoCubicAbs: {
            value: function SVGPathElement_createSVGPathSegCurvetoCubicAbs(x, y, x1, y1, x2, y2){
                return new SVGPathSegCurvetoCubicAbs(x, y, x1, y1, x2, y2);
            }
        },

        createSVGPathSegCurvetoQuadraticAbs: {
            value: function SVGPathElement_createSVGPathSegCurvetoQuadraticAbs(x, y, x1, y1){
                return new SVGPathSegCurvetoQuadraticAbs(x, y, x1, y1);
            }
        },

        createSVGPathSegClosePath: {
            value: function SVGPathElement_createSVGPathSegClosePath(){
                return new SVGPathSegClosePath();
            }
        }

    });

}

})(JSGlobalObject);
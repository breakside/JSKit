'use strict';
// -----------------------------------------------------------------------------
// Mark: Sizes

function JSSize(width, height){
    if (this === undefined){
        return new JSSize(width, height);
    }else{
        if (width instanceof JSSize){
            this.width = width.width;
            this.height = width.height;
        }else{
            this.width = width;
            this.height = height;
        }
    }
}

JSSize.prototype = {
    width: 0,
    height: 0
};

JSSize.Zero = JSSize(0, 0);

function JSPoint(x, y){
    if (this === undefined){
        return new JSPoint(x, y);
    }else{
        if (x instanceof JSPoint){
            this.x = x.x;
            this.y = x.y;
        }else{
            this.x = x;
            this.y = y;
        }
    }
}

JSPoint.prototype = {
    x: 0,
    y: 0
};

JSPoint.Zero = JSPoint(0, 0);
JSPoint.UnitCenter = JSPoint(0.5, 0.5);


function JSRect(x, y, width, height){
    if (this === undefined){
        return new JSRect(x, y, width, height);
    }else{
        if (x instanceof JSRect){
            this.origin = JSPoint(x.origin);
            this.size = JSSize(x.size);
        }else{
            this.origin = JSPoint(x, y);
            this.size = JSSize(width, height);
        }
    }
}

JSRect.prototype = {
    origin: null,
    size: null,

    rectWithInsets: function(top, right, bottom, left){
        if (right === undefined) right = top;
        if (bottom === undefined) bottom = top;
        if (left === undefined) left = right;
        return new JSRect(this.origin.x + left, this.origin.y + top, this.size.width - left - right, this.size.height - top - bottom);
    }
};

JSRect.Zero = JSRect(0, 0, 0, 0);


function JSRange(location, length){
    if (this === undefined){
        return new JSRange(location, length);
    }else{
        if (location instanceof JSRange){
            this.location = location.location;
            this.length = location.length;
        }else{
            this.location = location;
            this.length = length;
        }
    }
}

JSRange.prototype = {
    location: 0,
    length: 0
};


function JSAffineTransform(a, b, c, d, tx, ty){
    if (this === undefined){
        return new JSAffineTransform(a, b, c, d, tx, ty);
    }else{
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.tx = tx;
        this.ty = ty;
    }
}

JSAffineTransform.prototype = {
    a: 0,
    b: 0,
    c: 0,
    d: 0,
    tx: 0,
    ty: 0
};

JSAffineTransform.Identity = JSAffineTransform(1, 0, 0, 1, 0, 0);


function JSConstraintBox(props){
    if (this === undefined){
        return new JSConstraintBox(props);
    }else{
        if (props !== undefined){
            for (var x in props){
                this[x] = props[x];
            }
        }
    }
}

JSConstraintBox.prototype = {
    top: undefined,
    bottom: undefined,
    left: undefined,
    right: undefined,
    width: undefined,
    height: undefined
};

JSConstraintBox.Size = function(width, height){
    var box = JSConstraintBox();
    box.width = width;
    box.height = height;
    return box;
};

JSConstraintBox.Margin = function(top, right, bottom, left){
    var box = JSConstraintBox();
    box.top = (top === undefined) ? 0 : top;
    box.right = (right === undefined) ? box.top : right;
    box.bottom = (bottom === undefined) ? box.top : bottom;
    box.left = (left === undefined) ? box.right : left;
    return box;
};

JSConstraintBox.AnchorTop = function(height){
    return new JSConstraintBox({
        top: 0,
        left: 0,
        right: 0,
        height: height
    });
};

JSConstraintBox.AnchorLeft = function(width){
    return new JSConstraintBox({
        top: 0,
        left: 0,
        bottom: 0,
        width: width
    });
};

JSConstraintBox.AnchorBottom = function(height){
    return new JSConstraintBox({
        bottom: 0,
        left: 0,
        right: 0,
        height: height
    });
};

JSConstraintBox.AnchorRight = function(width){
    return new JSConstraintBox({
        top: 0,
        right: 0,
        bottom: 0,
        width: width
    });
};

JSConstraintBox.Rect = function(rect){
    return new JSConstraintBox({
        top: rect.origin.y,
        left: rect.origin.x,
        width: rect.size.width,
        height: rect.size.height
    });
};

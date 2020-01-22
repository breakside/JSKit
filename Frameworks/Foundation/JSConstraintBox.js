'use strict';

JSGlobalObject.JSConstraintBox = function JSConstraintBox(props){
    if (this === undefined){
        if (props === null){
            return null;
        }
        return new JSConstraintBox(props);
    }else{
        if (props !== undefined){
            for (var x in props){
                this[x] = props[x];
            }
        }
    }
};

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
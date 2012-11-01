// -----------------------------------------------------------------------------
// Mark: Sizes

function JSSize(){
}

JSSize.prototype = {
    
    width   : 0,
    height  : 0,
    
};

function JSSizeMake(width, height){
    var size = new JSSize();
    size.width = width;
    size.height = height;
    return size;
}

function JSPoint(){
}

JSPoint.prototype = {
    
    x: 0,
    y: 0,
    
};

function JSPointMake(x,y){
    var point = new JSPoint();
    point.x = x;
    point.y = y;
    return point;
}

function JSRect(){
}

JSRect.prototpye = {
    
    x       : 0,
    y       : 0,
    width   : 0,
    height  : 0,
    x2      : 0
    y2      : 0  
    
};

function JSRectMake(x,y,w,h,x2,y2){
    var rect = new JSRect();
    rect.x = x;
    rect.y = y;
    rect.width = w;
    rect.height = h;
    rect.x2 = x2;
    rect.y2 = y2;
    return rect;
}

function JSRectMakeWithMargin(top, right, bottom, left){
    if (right === undefined) right = top;
    if (left === undefined) left = right;
    if (bottom === undefined) bottom = top;
    return JSRectMake(left, top, undefined, undefined, right, bottom);
}

function JSRectMakeWithSize(width, height){
    return JSRectMake(undefined, undefined, width, height, undefined, undefined);
}

function JSRange(){
}

JSRange.prototype = {
    
    location    : 0,
    length      : 0,
};

function JSRangeMake(location, length){
    var range = new JSRange();
    range.location = location;
    range.length = length;
    return range;
}

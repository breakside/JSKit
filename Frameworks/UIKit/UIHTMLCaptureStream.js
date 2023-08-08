// #import Foundation
// #import DOM
"use strict";

JSClass("UIHTMLCaptureStream", JSObject, {

    frameNumber: 0,
    currentFrame: null,
    events: null,
    t0: null,
    nodeIndex: 0,
    indexesByNodeID: null,

    init: function(){
        this.events = [];
        this.indexesByNodeID = {};
    },

    importNode: function(node, includeChildren){
        if (this.currentFrame === null){
            return;
        }
        if (node.nodeType !== DOM.Node.ELEMENT_NODE && node.nodeType !== DOM.Node.TEXT_NODE){
            return -1;
        }
        var nodeIndex;
        if (node._UIHTMLCaptureStreamID === undefined){
            node._UIHTMLCaptureStreamID = UIHTMLCaptureStream.nextNodeID++;
        }
        nodeIndex = this.indexesByNodeID[node._UIHTMLCaptureStreamID];
        if (nodeIndex !== undefined){
            return nodeIndex;
        }
        nodeIndex = this.indexesByNodeID[node._UIHTMLCaptureStreamID] = this.nodeIndex++;
        if (node.nodeType === DOM.Node.ELEMENT_NODE){
            var element = node;
            var tag = element.tagName.toLowerCase();
            if (tag === "canvas"){
                this.addOperation(UIHTMLCaptureStream.Operation.createCanvas, nodeIndex, element.width, element.height);
            }else if (tag === "div"){
                this.addOperation(UIHTMLCaptureStream.Operation.createDiv, nodeIndex);
            }else if (tag === "span"){
                this.addOperation(UIHTMLCaptureStream.Operation.createSpan, nodeIndex);
            }else if (tag === "img"){
                this.addOperation(UIHTMLCaptureStream.Operation.createImg, nodeIndex);
            }else{
                this.addOperation(UIHTMLCaptureStream.Operation.createElement, nodeIndex, tag);
            }
            var i, l;
            var j, k;
            var attr;
            var name, value;
            var style;
            var overflow;
            var overflowX;
            var overflowY;
            var borderRadius;
            var borderRadiusTopLeft;
            var borderRadiusTopRight;
            var borderRadiusBottomRight;
            var borderRadiusBottomLeft;
            var borderWidth;
            var borderWidthTop;
            var borderWidthRight;
            var borderWidthBottom;
            var borderWidthLeft;
            var borderStyle;
            var borderStyleTop;
            var borderStyleRight;
            var borderStyleBottom;
            var borderStyleLeft;
            var borderColor;
            var borderColorTop;
            var borderColorRight;
            var borderColorBottom;
            var borderColorLeft;
            var transformOrigin;
            var transformOriginX;
            var transformOriginY;
            var operations = this.currentFrame[4];
            var styleOperationIndex;
            for (i = 0, l = element.attributes.length; i < l; ++i){
                attr = element.attributes[i];
                if (attr.name === "style"){
                    styleOperationIndex = operations.length;
                    style = "";
                    for (j = 0, k = element.style.length; j < k; ++j){
                        name = element.style.item(j);
                        value = element.style.getPropertyValue(name);
                        if (name === "position"){
                            if (value === "absolute"){
                                this.addOperation(UIHTMLCaptureStream.Operation.positionAbsolute, nodeIndex);
                            }else if (value === "relative"){
                                this.addOperation(UIHTMLCaptureStream.Operation.positionRelative, nodeIndex);
                            }else if (value === "fixed"){
                                this.addOperation(UIHTMLCaptureStream.Operation.positionFixed, nodeIndex);
                            }else if (value === "static" || value === ""){
                                this.addOperation(UIHTMLCaptureStream.Operation.positionStatic, nodeIndex);
                            }else{
                                style += name;
                                style += ": ";
                                style += value; // TODO: escaping?
                                style += "; ";
                            }
                        }else if (name === "box-sizing"){
                            // TODO: also -moz-box-sizing, but don't duplicate
                            if (value === "border-box"){
                                this.addOperation(UIHTMLCaptureStream.Operation.boxSizingBorder, nodeIndex);
                            }else if (value === "content-box" || value === ""){
                                this.addOperation(UIHTMLCaptureStream.Operation.boxSizingContent, nodeIndex);
                            }else{
                                style += name;
                                style += ": ";
                                style += value; // TODO: escaping?
                                style += "; ";
                            }
                        }else if (name === "top"){
                            this.addOperation(UIHTMLCaptureStream.Operation.top, nodeIndex, value);
                        }else if (name === "right"){
                            this.addOperation(UIHTMLCaptureStream.Operation.right, nodeIndex, value);
                        }else if (name === "bottom"){
                            this.addOperation(UIHTMLCaptureStream.Operation.bottom, nodeIndex, value);
                        }else if (name === "left"){
                            this.addOperation(UIHTMLCaptureStream.Operation.left, nodeIndex, value);
                        }else if (name === "width"){
                            this.addOperation(UIHTMLCaptureStream.Operation.width, nodeIndex, value);
                        }else if (name === "height"){
                            this.addOperation(UIHTMLCaptureStream.Operation.height, nodeIndex, value);
                        }else if (name === "overflow"){
                            overflow = value;
                        }else if (name === "overflow-x"){
                            overflowX = value;
                        }else if (name === "overflow-y"){
                            overflowY = value;
                        }else if (name === "visibility"){
                            if (value === "hidden"){
                                this.addOperation(UIHTMLCaptureStream.Operation.visibilityHidden, nodeIndex);
                            }else if (value === "visible" || value === ""){
                                this.addOperation(UIHTMLCaptureStream.Operation.visibilityVisible, nodeIndex);
                            }else{
                                style += name;
                                style += ": ";
                                style += value; // TODO: escaping?
                                style += "; ";
                            }
                        }else if (name === "background-image"){
                            this.addOperation(UIHTMLCaptureStream.Operation.backgroundImage, nodeIndex, value);
                        }else if (name === "background-color"){
                            this.addOperation(UIHTMLCaptureStream.Operation.backgroundColor, nodeIndex, value);
                        }else if (name === "backdrop-filter"){
                            // TODO: also check -webkit-backdrop-filter, but don't duplicate
                            this.addOperation(UIHTMLCaptureStream.Operation.backdropFilter, nodeIndex, value);
                        }else if (name === "filter"){
                            this.addOperation(UIHTMLCaptureStream.Operation.filter, nodeIndex, value);
                        }else if (name === "z-index"){
                            this.addOperation(UIHTMLCaptureStream.Operation.zIndex, nodeIndex, value);
                        }else if (name === "transform-origin"){
                            transformOrigin = value;
                        }else if (name === "transform-origin-x"){
                            transformOriginX = value;
                        }else if (name === "transform-origin-y"){
                            transformOriginY = value;
                        }else if (name === "transform-origin-z" && value === "0px"){
                            // ignore
                        }else if (name === "transform"){
                            this.addOperation(UIHTMLCaptureStream.Operation.elementTransform, nodeIndex, value);
                        }else if (name === "opacity"){
                            this.addOperation(UIHTMLCaptureStream.Operation.opacity, nodeIndex, value);
                        }else if (name === "border-width"){
                            borderWidth = value;
                        }else if (name === "border-top-width"){
                            borderWidthTop = value;
                        }else if (name === "border-right-width"){
                            borderWidthRight = value;
                        }else if (name === "border-bottom-width"){
                            borderWidthBottom = value;
                        }else if (name === "border-left-width"){
                            borderWidthLeft = value;
                        }else if (name === "border-style"){
                            borderStyle = value;
                        }else if (name === "border-top-style"){
                            borderStyleTop = value;
                        }else if (name === "border-right-style"){
                            borderStyleRight = value;
                        }else if (name === "border-bottom-style"){
                            borderStyleBottom = value;
                        }else if (name === "border-left-style"){
                            borderStyleLeft = value;
                        }else if (name === "border-color"){
                            borderColor = value;
                        }else if (name === "border-top-color"){
                            borderColorTop = value;
                        }else if (name === "border-right-color"){
                            borderColorRight = value;
                        }else if (name === "border-bottom-color"){
                            borderColorBottom = value;
                        }else if (name === "border-left-color"){
                            borderColorLeft = value;
                        }else if (name === "border-radius"){
                            borderRadius = value;
                        }else if (name === "border-top-left-radius"){
                            borderRadiusTopLeft = value;
                        }else if (name === "border-top-right-radius"){
                            borderRadiusTopRight = value;
                        }else if (name === "border-bottom-right-radius"){
                            borderRadiusBottomRight = value;
                        }else if (name === "border-bottom-left-radius"){
                            borderRadiusBottomLeft = value;
                        }else if (name === "border-image"){
                            this.addOperation(UIHTMLCaptureStream.Operation.borderImage, nodeIndex, value);
                        }else if (name === "box-shadow"){
                            this.addOperation(UIHTMLCaptureStream.Operation.boxShadow, nodeIndex, value);
                        }else if (name === "cursor"){
                            // ingore
                        }else if (name === "touch-action"){
                            // ignore
                        }else if (name === "pointer-events"){
                            // ignore
                        }else if (name === "outline"){
                            // ignore
                        }else if (name === "outline-width"){
                            // ignore
                        }else if (name === "outline-style"){
                            // ignore
                        }else if (name === "outline-color"){
                            // ignore
                        }else if (name === "font-style" && value === "normal"){
                            // ignore
                        }else if (name === "font-variant-caps" && value === "normal"){
                            // ignore
                        }else if (name === "font-stretch" && value === "normal"){
                            // ignore
                        }else if (name === "font-size-adjust" && value === "none"){
                            // ignore
                        }else if (name === "font-kerning" && value === "auto"){
                            // ignore
                        }else if (name === "font-variant-alternates" && value === "normal"){
                            // ignore
                        }else if (name === "font-variant-ligatures" && value === "normal"){
                            // ignore
                        }else if (name === "font-variant-numeric" && value === "normal"){
                            // ignore
                        }else if (name === "font-variant-east-asian" && value === "normal"){
                            // ignore
                        }else if (name === "font-variant-position" && value === "normal"){
                            // ignore
                        }else if (name === "font-feature-settings" && value === "normal"){
                            // ignore
                        }else if (name === "font-optical-sizing" && value === "auto"){
                            // ignore
                        }else if (name === "font-variation-settings" && value === "normal"){
                            // ignore
                        }else{
                            style += name;
                            style += ": ";
                            style += value; // TODO: escaping?
                            style += "; ";
                        }
                    }
                    if (overflow === undefined && overflowX !== undefined && overflowY !== undefined && overflowX === overflowY){
                        overflow = overflowX;
                        overflowX = undefined;
                        overflowY = undefined;
                    }
                    if (overflow !== undefined){
                        if (overflow === "hidden"){
                            this.addOperation(UIHTMLCaptureStream.Operation.overflowHidden, nodeIndex);
                        }else if (overflow === "visible" || overflow === ""){
                            this.addOperation(UIHTMLCaptureStream.Operation.overflowVisible, nodeIndex);
                        }else{
                            style += "overflow: ";
                            style += overflow; // TODO: escaping?
                            style += "; ";
                        }
                    }else{
                        if (overflowX !== undefined){
                            style += "overflow-x: ";
                            style += overflowX; // TODO: escaping?
                            style += "; ";
                        }
                        if (overflowY !== undefined){
                            style += "overflow-y: ";
                            style += overflowY; // TODO: escaping?
                            style += "; ";
                        }
                    }
                    if (borderWidth === undefined){
                        if (borderWidthTop !== undefined || borderWidthRight !== undefined || borderWidthBottom !== undefined || borderWidthLeft !== undefined){
                            if (borderWidthTop === undefined){
                                borderWidthTop = "0";
                            }
                            if (borderWidthRight === undefined){
                                borderWidthRight = "0";
                            }
                            if (borderWidthBottom === undefined){
                                borderWidthBottom = "0";
                            }
                            if (borderWidthLeft === undefined){
                                borderWidthLeft = "0";
                            }
                            if (borderWidthTop === borderWidthRight && borderWidthRight === borderWidthBottom && borderWidthBottom === borderWidthLeft){
                                borderWidth = borderWidthTop;
                            }else{
                                borderWidth = borderWidthTop + " " + borderWidthRight + " " + borderWidthBottom + " " + borderWidthLeft;
                            }
                        }
                    }
                    if (borderWidth !== undefined){
                        this.addOperation(UIHTMLCaptureStream.Operation.borderWidth, nodeIndex, borderWidth);
                    }
                    if (borderStyle === undefined){
                        if (borderStyleTop !== undefined || borderStyleRight !== undefined || borderStyleBottom !== undefined || borderStyleLeft !== undefined){
                            if (borderStyleTop === undefined){
                                borderStyleTop = "none";
                            }
                            if (borderStyleRight === undefined){
                                borderStyleRight = "none";
                            }
                            if (borderStyleBottom === undefined){
                                borderStyleBottom = "none";
                            }
                            if (borderStyleLeft === undefined){
                                borderStyleLeft = "none";
                            }
                            if (borderStyleTop === borderStyleRight && borderStyleRight === borderStyleBottom && borderStyleBottom === borderStyleLeft){
                                borderStyle = borderStyleTop;
                            }else{
                                borderStyle = borderStyleTop + " " + borderStyleRight + " " + borderStyleBottom + " " + borderStyleLeft;
                            }
                        }
                    }
                    if (borderStyle !== undefined){
                        this.addOperation(UIHTMLCaptureStream.Operation.borderStyle, nodeIndex, borderStyle);
                    }
                    if (borderColor === undefined){
                        if (borderColorTop !== undefined || borderColorRight !== undefined || borderColorBottom !== undefined || borderColorLeft !== undefined){
                            if (borderColorTop === undefined){
                                borderColorTop = "transparent";
                            }
                            if (borderColorRight === undefined){
                                borderColorRight = "transparent";
                            }
                            if (borderColorBottom === undefined){
                                borderColorBottom = "transparent";
                            }
                            if (borderColorLeft === undefined){
                                borderColorLeft = "transparent";
                            }
                            if (borderColorTop === borderColorRight && borderColorRight === borderColorBottom && borderColorBottom === borderColorLeft){
                                borderColor = borderColorTop;
                            }else{
                                borderColor = borderColorTop + " " + borderColorRight + " " + borderColorBottom + " " + borderColorLeft;
                            }
                        }
                    }
                    if (borderColor !== undefined){
                        this.addOperation(UIHTMLCaptureStream.Operation.borderColor, nodeIndex, borderColor);
                    }
                    if (borderRadius === undefined){
                        if (borderRadiusTopLeft !== undefined || borderRadiusTopRight !== undefined || borderRadiusBottomRight !== undefined || borderRadiusBottomLeft !== undefined){
                            if (borderRadiusTopLeft === undefined){
                                borderRadiusTopLeft = "0";
                            }
                            if (borderRadiusTopRight === undefined){
                                borderRadiusTopRight = "0";
                            }
                            if (borderRadiusBottomRight === undefined){
                                borderRadiusBottomRight = "0";
                            }
                            if (borderRadiusBottomLeft === undefined){
                                borderRadiusBottomLeft = "0";
                            }
                            if (borderRadiusTopLeft === borderRadiusTopRight && borderRadiusTopRight === borderRadiusBottomRight && borderRadiusBottomRight === borderRadiusBottomLeft){
                                borderRadius = borderRadiusTopLeft;
                            }else{
                                borderRadius = borderRadiusTopLeft + " " + borderRadiusTopRight + " " + borderRadiusBottomRight + " " + borderRadiusBottomLeft;
                            }
                        }
                    }
                    if (borderRadius !== undefined){
                        this.addOperation(UIHTMLCaptureStream.Operation.borderRadius, nodeIndex, borderRadius);
                    }
                    if (transformOrigin === undefined && transformOriginX !== undefined && transformOriginY !== undefined){
                        transformOrigin = transformOriginX + " " + transformOriginY;
                    }
                    if (transformOrigin !== undefined){
                        this.addOperation(UIHTMLCaptureStream.Operation.elementTransformOrigin, nodeIndex, transformOrigin);
                    }
                    if (style.length > 0){
                        operations.splice(styleOperationIndex, 0, UIHTMLCaptureStream.Operation.setAttribute, nodeIndex, "style", style);
                    }
                }else if (attr.name !== "role" && attr.name !== "id" && attr.name !== "tabindex" && !attr.name.startsWith("aria-") && !attr.name.startsWith("data-")){
                    this.addOperation(UIHTMLCaptureStream.Operation.setAttribute, nodeIndex, attr.name, attr.value);
                }
            }
            if (includeChildren){
                var child;
                var childIndex;
                for (i = 0, l = element.childNodes.length; i < l; ++i){
                    child = element.childNodes[i];
                    childIndex = this.importNode(child, true);
                    if (childIndex >= 0){
                        this.addOperation(UIHTMLCaptureStream.Operation.appendChild, nodeIndex, childIndex);
                    }
                }
            }
        }else if (node.nodeType === DOM.Node.TEXT_NODE){
            this.addOperation(UIHTMLCaptureStream.Operation.createTextNode, nodeIndex, node.nodeValue);
        }
        return nodeIndex;
    },

    insertNode: function(node, parentNode, sibling){
        if (this.currentFrame === null){
            return;
        }
        if (node._UIHTMLCaptureStreamID === undefined){
            this.importNode(node, true);
        }
        if (parentNode._UIHTMLCaptureStreamID === undefined){
            return;
        }
        var nodeIndex = this.indexesByNodeID[node._UIHTMLCaptureStreamID];
        var parentNodeIndex = this.indexesByNodeID[node.parentNode._UIHTMLCaptureStreamID];
        if (nodeIndex === undefined){
            this.importNode(node, true);
            nodeIndex = this.indexesByNodeID[node._UIHTMLCaptureStreamID];
            if (nodeIndex === undefined){
                return;
            }
        }
        if (parentNodeIndex === undefined){
            return;
        }
        if (sibling){
            if (sibling._UIHTMLCaptureStreamID === undefined){
                return;
            }
            var siblingNodeIndex = this.indexesByNodeID[sibling._UIHTMLCaptureStreamID];
            if (siblingNodeIndex === undefined){
                return;
            }
            this.addOperation(UIHTMLCaptureStream.Operation.insertBefore, parentNodeIndex, siblingNodeIndex, nodeIndex);
        }else{
            this.addOperation(UIHTMLCaptureStream.Operation.appendChild, parentNodeIndex, nodeIndex);
        }
    },

    removeNode: function(node){
        if (this.currentFrame === null){
            return;
        }
        if (!node.parentNode){
            return;
        }
        if (node._UIHTMLCaptureStreamID === undefined){
            return;
        }
        if (node.parentNode._UIHTMLCaptureStreamID === undefined){
            return;
        }
        var nodeIndex = this.indexesByNodeID[node._UIHTMLCaptureStreamID];
        var parentNodeIndex = this.indexesByNodeID[node.parentNode._UIHTMLCaptureStreamID];
        if (nodeIndex === undefined){
            return;
        }
        if (parentNodeIndex === undefined){
            return;
        }
        this.addOperation(UIHTMLCaptureStream.Operation.removeChild, parentNodeIndex, nodeIndex);
    },

    addNodeOperation: function(node, op){
        if (this.currentFrame === null){
            return;
        }
        if (node._UIHTMLCaptureStreamID === undefined){
            return;
        }
        var nodeIndex = this.indexesByNodeID[node._UIHTMLCaptureStreamID];
        if (nodeIndex === undefined){
            return;
        }
        this.currentFrame[4].push(op);
        this.currentFrame[4].push(nodeIndex);
        for (var i = 2, l = arguments.length; i < l; ++i){
            this.currentFrame[4].push(arguments[i]);
        }
    },

    addOperation: function(op){
        if (this.currentFrame === null){
            return;
        }
        this.currentFrame[4].push(op);
        for (var i = 1, l = arguments.length; i < l; ++i){
            this.currentFrame[4].push(arguments[i]);
        }
    },

    addEvent: function(event){
        this.events.push(event);
    },

    startFrame: function(t, type, x, y){
        if (this.frameNumber === 0){
            this.started = true;
            this.t0 = t;
            this.captureHeader();
        }
        if (type === UIHTMLCaptureStream.FrameType.key){
            this.nodeIndex = 0;
            this.indexesByNodeID = {};
        }
        this.currentFrame = [t - this.t0, type, x, y, [], this.events];
        ++this.frameNumber;
    },

    endFrame: function(){
        if (this.delegate && this.delegate.htmlCaptureStreamDidCreateFrame){
            this.delegate.htmlCaptureStreamDidCreateFrame(this, this.currentFrame);
        }else{
            console.log(JSON.stringify(this.currentFrame));
        }
        this.currentFrame = null;
        this.events = [];
    },

    captureHeader: function(){
        var header = {
            base: UIApplication.shared.baseURL.encodedString,
            fonts: []
        };
        var i, l;
        var descriptors = JSFontDescriptor.registeredDescriptors();
        for (i = 0, l = descriptors.length; i < l; ++i){
            header.fonts.push(descriptors[i].htmlCaptureInfo());
        }
        if (this.delegate && this.delegate.htmlCaptureStreamDidCreateHeader){
            this.delegate.htmlCaptureStreamDidCreateHeader(this, header);
        }else{
            console.log(JSON.stringify(header));
        }
    },

});

UIHTMLCaptureStream.nextNodeID = 1;

UIHTMLCaptureStream.FrameType = {
    key: 1,
    diff: 2
};

UIHTMLCaptureStream.Operation = {

    // Control
    null: 0x00,
    screenSize: 0x01, // width:Integer, height:Integer

    // DOM Manipulation
    createElement: 0x10, // name:String
    setAttribute: 0x11, // name:String, name:Value
    appendChild: 0x12, // parent:StreamNodeIndex, child:StreamNodeIndex
    insertBefore: 0x13, // parent:StreamNodeIndex, sibling:StreamNodeIndex, child:StreamNodeIndex
    removeChild: 0x14, // parent:StreamNodeIndex, child:StreamNodeIndex
    createTextNode: 0x15, // text:String
    createDiv: 0x16,
    createSpan: 0x17,
    createImg: 0x18,
    createCanvas: 0x19, // width:Integer, height:Integer

    // Positioning
    positionStatic: 0x20, // element:StreamNodeIndex
    positionAbsolute: 0x21, // element:StreamNodeIndex
    positionRelative: 0x22, // element:StreamNodeIndex
    positionFixed: 0x23, // element:StreamNodeIndex
    boxSizingContent: 0x24, // element:StreamNodeIndex
    boxSizingBorder: 0x25, // element:StreamNodeIndex
    top: 0x26, // element:StreamNodeIndex, value:String
    right: 0x27, // element:StreamNodeIndex, value:String
    bottom: 0x28, // element:StreamNodeIndex, value:String
    left: 0x29, // element:StreamNodeIndex, value:String
    width: 0x2a, // element:StreamNodeIndex, value:String
    height: 0x2b, // element:StreamNodeIndex, value:String
    zIndex: 0x2c, // element:StreamNodeIndex, value:String
    elementTransformOrigin: 0x2d, // element:StreamNodeIndex, value:String
    elementTransform: 0x2e, // element:StreamNodeIndex, value:String
    
    // Style
    visibilityVisible: 0x30, // element:StreamNodeIndex
    visibilityHidden: 0x31, // element:StreamNodeIndex
    overflowVisible: 0x32, // element:StreamNodeIndex
    overflowHidden: 0x33, // element:StreamNodeIndex
    opacity: 0x34, // element:StreamNodeIndex, value:String
    backgroundColor: 0x35, // element:StreamNodeIndex, value:String
    backgroundImage: 0x36, // element:StreamNodeIndex, value:String
    borderWidth: 0x37, // element:StreamNodeIndex, value:String
    borderColor: 0x38, // element:StreamNodeIndex, value:String
    borderRadius: 0x39, // element:StreamNodeIndex, value:String
    borderStyle: 0x3a, // element:StreamNodeIndex, value:String
    borderImage: 0x3b, // element:element, value:String
    boxShadow: 0x3c, // element:StreamNodeIndex, value:String
    backdropFilter: 0x3d, // element:StreamNodeIndex, value:String
    filter: 0x3e, // element:StreamNodeIndex, value:String

    // Canvas State
    canvasSize: 0x40, // canvas:StreamNodeIndex, width:Integer, height:Integer
    save: 0x41, // canvas:StreamNodeIndex
    restore: 0x42, // canvas:StreamNodeIndex
    globalAlpha: 0x43, // canvas:StreamNodeIndex, value:Number
    fillStyle: 0x44, // canvas:StreamNodeIndex, value:String
    strokeStyle: 0x45, // canvas:StreamNodeIndex, value:String
    lineWidth: 0x46, // canvas:StreamNodeIndex, value:Number
    lineCap: 0x47, // canvas:StreamNodeIndex, value:String
    lineJoin: 0x48, // canvas:StreamNodeIndex, value:String
    miterLimit: 0x49, // canvas:StreamNodeIndex, value:Number
    lineDash: 0x4a, // canvas:StreamNodeIndex, phase:Number, n:Integer, l1:Number, ...
    shadowOffset: 0x4b, // canvas:StreamNodeIndex, x:Number, x:Number
    shadowBlur: 0x4c, // canvas:StreamNodeIndex, value:Number
    shadowColor: 0x4d, // canvas:StreamNodeIndex, value:String
    font: 0x4e, // canvas:StreamNodeIndex, value:String

    // Canvas Paint
    fill: 0x50, // canvas:StreamNodeIndex
    fillEvenOdd: 0x51, // canvas:StreamNodeIndex
    stroke: 0x52, // canvas:StreamNodeIndex
    clearRect: 0x53, // canvas:StreamNodeIndex, x:Number, y:Number, width:Number, height: Number
    fillRect: 0x54, // canvas:StreamNodeIndex, x:Number, y:Number, width:Number, height: Number
    strokeRect: 0x55, // canvas:StreamNodeIndex, x:Number, y:Number, width:Number, height: Number
    fillText: 0x56, // canvas:StreamNodeIndex, text:String, x:Number, y:Number
    strokeText: 0x57, // canvas:StreamNodeIndex, text:String, x:Number, y:Number
    clip: 0x58, // canvas:StreamNodeIndex
    clipEvenOdd: 0x59, // canvas:StreamNodeIndex
    linearGradient: 0x5a, // canvas:StreamNodeIndex, x1:Number, y1:Number, x2:Number, y2:Number, n:Number, position:Number, color:String, ...
    radialGradient: 0x5b, // canvas:StreamNodeIndex, x1:Number, y1:Number, r1:Number, x2:Number, y2:Number, r2:Number, n:Number, position:Number, color:Number, ...

    // Canvas Path
    beginPath: 0x60, // canvas:StreamNodeIndex
    closePath: 0x61, // canvas:StreamNodeIndex
    moveTo: 0x62, // canvas:StreamNodeIndex, x:Number, y:Number
    lineTo: 0x63, // canvas:StreamNodeIndex, x:Number, y:Number
    bezierCurveTo: 0x64, // canvas:StreamNodeIndex, c1x:Number, c1y:Number, c2x:Number, c2y:Number, x:Number, y:Number
    setTransform: 0x65, // canvas:StreamNodeIndex, a:Number, b:Number, c:Number, d:Number, tx:Number, ty:Number
    transform: 0x66, // canvas:StreamNodeIndex, a:Number, b:Number, c:Number, d:Number, tx:Number, ty:Number
    translate: 0x67, // canvas:StreamNodeIndex, x:Number, y:Number
    scale: 0x68, // canvas:StreamNodeIndex, x:Number, y:Number

};
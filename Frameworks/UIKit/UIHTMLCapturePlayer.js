// #import "UIView.js"
// #import "UIHTMLElementLayer.js"
// #import "UIHTMLCaptureStream.js"
"use strict";

(function(){

var logger = JSLog("uikit", "capture-player");

JSClass("UIHTMLCapturePlayer", UIView, {

    nodes: null,
    iframeElement: null,
    rootElement: null,
    screenElement: null,
    cursorElement: null,
    screenSize: null,

    cursorImage: JSDynamicProperty("_cursorImage", null),
    cursorHotSpot: JSDynamicProperty("_cursorHotSpot", JSPoint.Zero),

    setCursorImage: function(image){
        this._cursorImage = image;
        this.updateCursorElement();
    },

    setCursorHotSpot: function(cursorHotSpot){
        this._cursorHotSpot = JSPoint(cursorHotSpot);
        this.updateCursorElement();
    },

    updateCursorElement: function(){
        if (this.cursorElement === null){
            return;
        }
        if (this._cursorImage !== null){
            this.cursorElement.style.visibility = "";
            this.cursorElement.style.width = "%dpx".sprintf(this._cursorImage.size.width);
            this.cursorElement.style.height = "%dpx".sprintf(this._cursorImage.size.height);
            this.cursorElement.style.background = 'url("%s")'.sprintf(this._cursorImage.htmlURLString());
        }else{
            this.cursorElement.style.visibility = "hidden";
        }
        this.cursorElement.style.transform = "translate(-%fpx,-%fpx)".sprintf(this._cursorHotSpot.x, this._cursorHotSpot.y);
    },

    layerDidCreateElement: function(layer){
    },

    header: null,
    frameBuffer: null,
    frameCount: 0,

    receiveHeader: function(header){
        this.frameBuffer = [];
        this.frameCount = 0;
        this.playbackTime = 0;
        this.playbackOffset = 0;
        this.displayTime0 = null;
        this.playing = false;
        this.header = header;
        if (this.iframeElement !== null){
            this.iframeElement.parentNode.removeChild(this.iframeElement);
            this.rootElement = null;
            this.cursorElement = null;
            this.screenElement = null;
            this.iframeElement = null;
            this.nodes = [];
        }
        this.setNeedsDisplay();
    },

    receiveFrames: function(frames){
        if (this.frameBuffer === null){
            this.frameBuffer = frames;
        }else{
            this.frameBuffer = this.frameBuffer.concat(frames);
        }
        this.frameCount = this.frameBuffer.length;
    },

    playbackOffset: 0,
    playbackRate: 1.0,
    playing: false,
    displayTime0: null,
    playbackTime: 0,

    play: function(){
        if (!this.playing){
            if (this.lastPlayedFrameNumber >= this.frameCount - 1){
                this.playbackTime = 0;
                this.playbackOffset = 0;
                this.displayTime0 = null;
            }
            this.playing = true;
            this.schedulePlaybackFrame();
        }
    },

    schedulePlaybackFrame: function(){
        this.layer._displayServer.schedule(this.playbackFrame, this);
    },

    playbackFrame: function(displayTime){
        if (this.displayTime0 === null){
            this.displayTime0 = displayTime;
        }
        if (this.playing){
            var playbackTime = (displayTime - this.displayTime0) * this.playbackRate + this.playbackOffset;
            this.playFrameAtTime(playbackTime);
            this.schedulePlaybackFrame();
        }
    },

    pause: function(){
        this.playing = false;
        this.displayTime0 = null;
        this.playbackOffset = this.playbackTime;
    },

    lastPlayedFrameNumber: -1,

    playFrameAtTime: function(playbackTime){
        this.playbackTime = playbackTime;
        var n = this.lastPlayedFrameNumber;
        var n0;
        var n1;
        if (n >= 0 && n < this.frameCount){
            if (playbackTime >= this.frameBuffer[n][0]){
                ++n;
                if (n >= this.frameCount){
                    // can't play any more
                    this.pause();
                    return;
                }
                if (playbackTime < this.frameBuffer[n][0]){
                    // still at current frame
                    return;
                }
                if (n === this.frameCount - 1 || playbackTime < this.frameBuffer[n + 1][0]){
                    // next frame
                    this.playFrameNumber(n);
                    return;
                }
                // some later frame...
                n0 = n + 1;
                n1 = this.frameCount;
            }else{
                // some previous frame...
                n0 = 0;
                n1 = n - 1;
            }
        }
        var d;
        while (n0 < n1){
            n = Math.floor(n0 + (n1 - n0) / 2);
            d = playbackTime - this.frameBuffer[n][0];
            if (d < 0){
                n1 = n;
            }else if (d > 0){
                n0 = n + 1;
            }else{
                n0 = n1 = n;
            }
        }
        this.playFrameNumber(n);
    },

    playFrameNumber: function(n){
        try{
            if (n === this.lastPlayedFrameNumber){
                return;
            }
            var n0 = this.lastPlayedFrameNumber + 1;
            var n1 = n;
            if (n0 !== n1){
                // We're skipping around, so find the nearest keyframe before n1
                if (n0 > n1){
                    // if skipping backwards, use frame 0 as our worst-case key frame
                    n0 = 0;
                }
                for (n = n1; n > n0; --n){
                    if (this.frameBuffer[n][1] === UIHTMLCaptureStream.FrameType.key){
                        n0 = n;
                        break;
                    }
                }
            }
            for (n = n0; n <= n1; ++n){
                this.renderFrameNumber(n);
            }
            this.lastPlayedFrameNumber = n1;
        }catch (e){
            logger.error("payback failure on frame %d: %{error}", n, e);
        }
    },

    renderFrameNumber: function(n){
        if (n < 0 || n >= this.frameCount){
            return;
        }
        var frame = this.frameBuffer[n];
        var type = frame[1];
        if (type === UIHTMLCaptureStream.FrameType.key){
            if (this.screenElement !== null){
                this.screenElement.parentNode.removeChild(this.screenElement);
                this.screenElement = null;
                this.nodes = [];
            }
        }
        this.cursorElement.style.left = "%dpx".sprintf(frame[2]);
        this.cursorElement.style.top = "%dpx".sprintf(frame[3]);
        var operations = frame[4];
        var events = frame[5];
        var op;
        var node;
        var element;
        var context;
        var name;
        var value;
        var l = operations.length;
        var i = 0;
        var j, k;
        var x, y, w, h;
        var a, b, c, d;
        var gradient;
        var nodes = this.nodes;
        var next = function(){
            if (l === 0){
                throw new Error("Invalid stream, expecting more operations or arguments");
            }
            return operations[i++];
        };
        var nextString = function(){
            var s = next();
            if (typeof(s) !== "string"){
                throw new Error("Invalid stream, expecting string at %d".sprintf(i - 1));
            }
            return s;
        };
        var nextInteger = function(){
            return Math.floor(nextNumber());
        };
        var nextNumber = function(){
            var n = next();
            if (typeof(n) !== "number"){
                throw new Error("Invalid stream, expecting number at %d".sprintf(i - 1));
            }
            return n;
        };
        var nextNode = function(){
            var n = nextInteger();
            if (n < 0 || n >= nodes.length){
                throw new Error("Invalid stream, unknown element index (%d) at %d".sprintf(n, i - 1));
            }
            return nodes[n];
        };
        var nextElement = function(){
            var node = nextNode();
            if (node.nodeType !== DOM.Node.ELEMENT_NODE){
                throw new Error("Invalid stream, expecting element at index %d".sprintf(i - 1));
            }
            return node;
        };
        var nextTextNode = function(){
            var node = nextNode();
            if (node.nodeType !== DOM.Node.TEXT_NODE){
                throw new Error("Invalid stream, expecting text node at index %d".sprintf(i - 1));
            }
            return node;
        };
        var nextCanvas = function(){
            var element = nextElement();
            if (element.nodeName.toLowerCase() !== "canvas"){
                throw new Error("Invalid stream, expecting canvas elmement index at %d".sprintf(i - 1));
            }
            return element;
        };
        var nextContext = function(){
            var element = nextCanvas();
            return element.getContext("2d");
        };
        while (i < l){
            op = next();
            if (op === UIHTMLCaptureStream.Operation.screenSize){
                this.screenSize.width = nextInteger();
                this.screenSize.height = nextInteger();
                this.iframeElement.style.width = "%dpx".sprintf(this.screenSize.width);
                this.iframeElement.style.height = "%dpx".sprintf(this.screenSize.height);
                this.layoutIframeElement();
            }else if (op === UIHTMLCaptureStream.Operation.createElement){
                x = nextInteger();
                this.createElement(nextString(), x);
            }else if (op === UIHTMLCaptureStream.Operation.createDiv){
                this.createElement("div", nextInteger());
            }else if (op === UIHTMLCaptureStream.Operation.createSpan){
                this.createElement("span", nextInteger());
            }else if (op === UIHTMLCaptureStream.Operation.createImg){
                this.createElement("img", nextInteger());
            }else if (op === UIHTMLCaptureStream.Operation.createCanvas){
                element = this.createElement("canvas", nextInteger());
                element.width = nextInteger();
                element.height = nextInteger();
            }else if (op === UIHTMLCaptureStream.Operation.createTextNode){
                x = nextInteger();
                if (x !== this.nodes.length){
                    throw new Error("node index mismatch, got %d expecting %d".sprintf(x, this.nodes.length));
                }
                node = this.rootElement.ownerDocument.createTextNode(nextString());
                this.nodes.push(node);
            }else if (op === UIHTMLCaptureStream.Operation.setAttribute){
                element = nextElement();
                name = nextString();
                value = nextString();
                element.setAttribute(name, value);
            }else if (op === UIHTMLCaptureStream.Operation.appendChild){
                element = nextElement();
                element.appendChild(nextNode());
            }else if (op === UIHTMLCaptureStream.Operation.insertBefore){
                element = nextElement();
                node = nextNode();
                element.insertBefore(nextNode(), node);
            }else if (op === UIHTMLCaptureStream.Operation.removeChild){
                element = nextElement();
                element.removeChild(nextNode());
            }else if (op === UIHTMLCaptureStream.Operation.positionStatic){
                element = nextElement();
                element.style.position = "";
            }else if (op === UIHTMLCaptureStream.Operation.positionAbsolute){
                element = nextElement();
                element.style.position = "absolute";
            }else if (op === UIHTMLCaptureStream.Operation.positionRelative){
                element = nextElement();
                element.style.position = "relative";
            }else if (op === UIHTMLCaptureStream.Operation.positionFixed){
                element = nextElement();
                element.style.position = "fixed";
            }else if (op === UIHTMLCaptureStream.Operation.boxSizingContent){
                element = nextElement();
                element.style.boxSizing = "";
                element.style.mozBoxSizing = "";
            }else if (op === UIHTMLCaptureStream.Operation.boxSizingBorder){
                element = nextElement();
                element.style.boxSizing = "border-box";
                element.style.mozBoxSizing = "border-box";
            }else if (op === UIHTMLCaptureStream.Operation.top){
                element = nextElement();
                element.style.top = nextString();
            }else if (op === UIHTMLCaptureStream.Operation.right){
                element = nextElement();
                element.style.right = nextString();
            }else if (op === UIHTMLCaptureStream.Operation.bottom){
                element = nextElement();
                element.style.bottom = nextString();
            }else if (op === UIHTMLCaptureStream.Operation.left){
                element = nextElement();
                element.style.left = nextString();
            }else if (op === UIHTMLCaptureStream.Operation.width){
                element = nextElement();
                element.style.width = nextString();
            }else if (op === UIHTMLCaptureStream.Operation.height){
                element = nextElement();
                element.style.height = nextString();
            }else if (op === UIHTMLCaptureStream.Operation.zIndex){
                element = nextElement();
                element.style.zIndex = nextString();
            }else if (op === UIHTMLCaptureStream.Operation.elementTransformOrigin){
                element = nextElement();
                element.style.transformOrigin = nextString();
            }else if (op === UIHTMLCaptureStream.Operation.elementTransform){
                element = nextElement();
                element.style.transform = nextString();
            }else if (op === UIHTMLCaptureStream.Operation.visibilityVisible){
                element = nextElement();
                element.style.visibility = "";
            }else if (op === UIHTMLCaptureStream.Operation.visibilityHidden){
                element = nextElement();
                element.style.visibility = "hidden";
            }else if (op === UIHTMLCaptureStream.Operation.overflowVisible){
                element = nextElement();
                element.style.overflow = "";
            }else if (op === UIHTMLCaptureStream.Operation.overflowHidden){
                element = nextElement();
                element.style.overflow = "hidden";
            }else if (op === UIHTMLCaptureStream.Operation.opacity){
                element = nextElement();
                element.style.opacity = nextString();
            }else if (op === UIHTMLCaptureStream.Operation.backgroundColor){
                element = nextElement();
                element.style.backgroundColor = nextString();
            }else if (op === UIHTMLCaptureStream.Operation.backgroundImage){
                element = nextElement();
                element.style.backgroundImage = nextString();
            }else if (op === UIHTMLCaptureStream.Operation.borderWidth){
                element = nextElement();
                element.style.borderWidth = nextString();
            }else if (op === UIHTMLCaptureStream.Operation.borderColor){
                element = nextElement();
                element.style.borderColor = nextString();
            }else if (op === UIHTMLCaptureStream.Operation.borderRadius){
                element = nextElement();
                element.style.borderRadius = nextString();
            }else if (op === UIHTMLCaptureStream.Operation.borderStyle){
                element = nextElement();
                element.style.borderStyle = nextString();
            }else if (op === UIHTMLCaptureStream.Operation.borderImage){
                element = nextElement();
                element.style.borderImage = nextString();
            }else if (op === UIHTMLCaptureStream.Operation.boxShadow){
                element = nextElement();
                element.style.boxShadow = nextString();
            }else if (op === UIHTMLCaptureStream.Operation.backdropFilter){
                element = nextElement();
                value = nextString();
                element.style.backdropFilter = value;
                element.style.webkitBackdropFilter = value;
            }else if (op === UIHTMLCaptureStream.Operation.filter){
                element = nextElement();
                element.style.filter = nextString();
            }else if (op === UIHTMLCaptureStream.Operation.canvasSize){
                element = nextCanvas();
                element.width = nextInteger();
                element.height = nextInteger();
            }else if (op === UIHTMLCaptureStream.Operation.save){
                context = nextContext();
                context.save();
            }else if (op === UIHTMLCaptureStream.Operation.restore){
                context = nextContext();
                context.restore();
            }else if (op === UIHTMLCaptureStream.Operation.globalAlpha){
                context = nextContext();
                context.globalAlpha = nextNumber();
            }else if (op === UIHTMLCaptureStream.Operation.fillStyle){
                context = nextContext();
                context.fillStyle = nextString();
            }else if (op === UIHTMLCaptureStream.Operation.strokeStyle){
                context = nextContext();
                context.strokeStyle = nextString();
            }else if (op === UIHTMLCaptureStream.Operation.lineWidth){
                context = nextContext();
                context.lineWidth = nextNumber();
            }else if (op === UIHTMLCaptureStream.Operation.lineCap){
                context = nextContext();
                context.lineCap = nextString();
            }else if (op === UIHTMLCaptureStream.Operation.lineJoin){
                context = nextContext();
                context.lineJoin = nextString();
            }else if (op === UIHTMLCaptureStream.Operation.miterLimit){
                context = nextContext();
                context.miterLimit = nextNumber();
            }else if (op === UIHTMLCaptureStream.Operation.lineDash){
                context = nextContext();
                context.lineDashOffset = nextNumber();
                k = nextNumber();
                var lengths = [];
                for (j = 0; j < k; ++j){
                    lengths.push(nextNumber());
                }
                context.setLineDash(lengths);
            }else if (op === UIHTMLCaptureStream.Operation.shadowOffset){
                context = nextContext();
                context.shadowOffsetX = nextNumber();
                context.shadowOffsetY = nextNumber();
            }else if (op === UIHTMLCaptureStream.Operation.shadowBlur){
                context = nextContext();
                context.shadowBlur = nextNumber();
            }else if (op === UIHTMLCaptureStream.Operation.shadowColor){
                context = nextContext();
                context.shadowColor = nextString();
            }else if (op === UIHTMLCaptureStream.Operation.font){
                context = nextContext();
                context.font = nextString();
            }else if (op === UIHTMLCaptureStream.Operation.fill){
                context = nextContext();
                context.fill();
            }else if (op === UIHTMLCaptureStream.Operation.fillEvenOdd){
                context = nextContext();
                context.fill("evenodd");
            }else if (op === UIHTMLCaptureStream.Operation.stroke){
                context = nextContext();
                context.stroke();
            }else if (op === UIHTMLCaptureStream.Operation.clearRect){
                context = nextContext();
                x = nextNumber();
                y = nextNumber();
                w = nextNumber();
                h = nextNumber();
                context.clearRect(x, y, w, h);
            }else if (op === UIHTMLCaptureStream.Operation.fillRect){
                context = nextContext();
                x = nextNumber();
                y = nextNumber();
                w = nextNumber();
                h = nextNumber();
                context.fillRect(x, y, w, h);
            }else if (op === UIHTMLCaptureStream.Operation.strokeRect){
                context = nextContext();
                x = nextNumber();
                y = nextNumber();
                w = nextNumber();
                h = nextNumber();
                context.strokeRect(x, y, w, h);
            }else if (op === UIHTMLCaptureStream.Operation.fillText){
                context = nextContext();
                value = nextString();
                x = nextNumber();
                y = nextNumber();
                context.fillText(value, x, y);
            }else if (op === UIHTMLCaptureStream.Operation.strokeText){
                context = nextContext();
                value = nextString();
                x = nextNumber();
                y = nextNumber();
                context.strokeText(value, x, y);
            }else if (op === UIHTMLCaptureStream.Operation.clip){
                context = nextContext();
                context.clip();
            }else if (op === UIHTMLCaptureStream.Operation.clipEvenOdd){
                context = nextContext();
                context.clip("evenodd");
            }else if (op === UIHTMLCaptureStream.Operation.linearGradient){
                context = nextContext();
                a = nextNumber();
                b = nextNumber();
                c = nextNumber();
                d = nextNumber();
                gradient = context.createLinearGradient(a, b, c, d);
                k = nextNumber();
                for (j = 0; j < k; ++j){
                    x = nextNumber();
                    gradient.addStop(x, nextString());
                }
                context.fillStyle = gradient;
                context.fillRect(0, 0, 1, 1);
            }else if (op === UIHTMLCaptureStream.Operation.radialGradient){
                context = nextContext();
                a = nextNumber();
                b = nextNumber();
                x = nextNumber();
                c = nextNumber();
                d = nextNumber();
                y = nextNumber();
                gradient = context.createRadialGradient(a, b, x, c, d, y);
                k = nextNumber();
                for (j = 0; j < k; ++j){
                    x = nextNumber();
                    gradient.addStop(x, nextString());
                }
                context.fillStyle = gradient;
                context.fillRect(0, 0, 1, 1);
            }else if (op === UIHTMLCaptureStream.Operation.beginPath){
                context = nextContext();
                context.beginPath();
            }else if (op === UIHTMLCaptureStream.Operation.closePath){
                context = nextContext();
                context.closePath();
            }else if (op === UIHTMLCaptureStream.Operation.moveTo){
                context = nextContext();
                x = nextNumber();
                y = nextNumber();
                context.moveTo(x, y);
            }else if (op === UIHTMLCaptureStream.Operation.lineTo){
                context = nextContext();
                x = nextNumber();
                y = nextNumber();
                context.lineTo(x, y);
            }else if (op === UIHTMLCaptureStream.Operation.bezierCurveTo){
                context = nextContext();
                a = nextNumber();
                b = nextNumber();
                c = nextNumber();
                d = nextNumber();
                x = nextNumber();
                y = nextNumber();
                context.bezierCurveTo(a, b, c, d, x, y);
            }else if (op === UIHTMLCaptureStream.Operation.setTransform){
                context = nextContext();
                a = nextNumber();
                b = nextNumber();
                c = nextNumber();
                d = nextNumber();
                x = nextNumber();
                y = nextNumber();
                context.setTransform(a, b, c, d, x, y);
            }else if (op === UIHTMLCaptureStream.Operation.transform){
                context = nextContext();
                a = nextNumber();
                b = nextNumber();
                c = nextNumber();
                d = nextNumber();
                x = nextNumber();
                y = nextNumber();
                context.transform(a, b, c, d, x, y);
            }else if (op === UIHTMLCaptureStream.Operation.translate){
                context = nextContext();
                x = nextNumber();
                y = nextNumber();
                context.translate(x, y);
            }else if (op === UIHTMLCaptureStream.Operation.scale){
                context = nextContext();
                x = nextNumber();
                y = nextNumber();
                context.scale(x, y);
            }
        }
    }, 

    createElement: function(name, n){
        if (n !== this.nodes.length){
            throw new Error("node index mismatch: got %d, expecting %d".sprintf(n, this.nodes.length));
        }
        var element = this.rootElement.ownerDocument.createElement(name);
        if (this.nodes.length === 0){
            this.screenElement = element;
            this.rootElement.insertBefore(this.screenElement, this.cursorElement);
        }
        this.nodes.push(element);
        return element;
    },

    drawLayerInContext: function(layer, context){
        layer.drawInContext(context);
        if (this.iframeElement === null){
            this.nodes = [];
            this.iframeElement = layer.element.ownerDocument.createElement("iframe");
            // this.iframeElement.sandbox = "allow-same-origin";
            this.iframeElement.style.border = 'none';
            this.iframeElement.style.pointerEvents = 'none';
            layer.element.appendChild(this.iframeElement);
            this.screenSize = JSSize.Zero;
            var document = this.iframeElement.contentDocument;
            var html = document.documentElement;
            var head = document.head;
            var body = document.body;
            this.rootElement = body;
            html.style.padding = '0';
            html.style.margin = '0';
            html.style.height = '100%';
            html.style.overflow = 'hidden';
            body.style.padding = '0';
            body.style.margin = '0';
            body.style.position = 'absolute';
            body.style.left = '0';
            body.style.top = '0';
            body.style.right = '0';
            body.style.bottom = '0';
            body.style.overflow = 'hidden';
            body.style.background = "white";
            this.cursorElement = document.createElement("div");
            this.cursorElement.style.position = "absolute";
            this.rootElement.appendChild(this.cursorElement);
            this.updateCursorElement();
            this.updateHeader();
            this.playFrameNumber(0);
        }
        this.layoutIframeElement();
    },

    layoutIframeElement: function(){
        var bounds = this.layer.presentation.bounds.rectWithInsets(this.layer.elementInsets);
        var sx = bounds.size.width / this.screenSize.width;
        var sy = bounds.size.height / this.screenSize.height;
        var s = Math.min(sx, sy);
        var tx = (bounds.size.width - s * this.screenSize.width) / 2.0;
        var ty = (bounds.size.height - s * this.screenSize.height) / 2.0;
        this.iframeElement.style.transformOrigin = "top left";
        this.iframeElement.style.transform = "translate(%fpx, %fpx) scale(%f, %f)".sprintf(tx, ty, s, s);
    },

    updateHeader: function(){
        if (this.header){
            var document = this.iframeElement.contentDocument;
            var base = document.createElement("base");
            base.href = this.header.base;
            document.head.appendChild(base);
            var i, l;
            var font;
            var face;
            for (i = 0, l = this.header.fonts.length; i < l; ++i){
                font = this.header.fonts[i];
                face = new FontFace(font.family, 'url("%s")'.sprintf(font.url), {
                    style: font.style,
                    weight: font.weight
                });
                this.registerFontFace(face, document);
            }
        }
    },

    registerFontFace: function(fontFace, document){
        fontFace.load().then(function(){
            document.fonts.add(fontFace);
        });
    }

});

UIHTMLCapturePlayer.layerClass = UIHTMLElementLayer;

})();
// #import "JSKit/JSViewRenderDelegate.js"


function JSHTMLViewRenderDelegate(){
}

JSHTMLViewRenderDelegate.renderDelegateType = JSViewRenderDelegateTypeHTML5;

JSHTMLViewRenderDelegate.prototype = {
    
    element                 : null,
    firstSubviewNodeIndex   : 0,
    positions               : null,
    
    // -------------------------------------------------------------------------
    // MARK: - Initialization
    
    init: function(){
        return this.initWithElementName('div');
    },
    
    initWithElementName: function(elementName){
        this.$super.init.call(this);
        this.element = document.createElement(elementName);
        this.setupElement();
        this.positions = {};
        return this;
    },
    
    setupElement: function(){
        this.element.style.position = 'absolute';
        this.element.style.boxSizing = 'border-box';
        this.element.style.mozBoxSizing = 'border-box';
    },
    
    // -------------------------------------------------------------------------
    // MARK: - Events
    
    viewCanStartReceivingEvents: function(view){
        var methodEventMap = {
            'mouseDown'     : 'mousedown',
            'mouseUp'       : 'mouseup',
            'mouseMoved'    : 'mousemove',
            'mouseEntered'  : 'mouseover',
            'mouseExited'   : 'mouseout',
        };
        for (var method in methodEventMap){
            if (method in view){
                this._addEventListener(methodEventMap[method]);
            }
        }
    },
    
    _addEventListener: function(eventType){
        if (this.element.attachEvent){
            this.element.attachEvent(eventType, this.handleEvent.enclose(this));
        }else{
            this.element.addEventListener(eventType, this, false);
        }
    },
    
    handleEvent: function(event){
        if (event.type == 'mousedown'){
            this.view.mouseDown(JSEvent.alloc.initWithDOMEvent(event));
        }else if (event.type == 'mouseup'){
            this.view.mouseUp(JSEvent.alloc.initWithDOMEvent(event));
        }else if (event.type == 'mouseover' && event.currentTarget === this.element){
            this.view.mouseEntered(JSEvent.alloc.initWithDOMEvent(event));
        }else if (event.type == 'mouseout' && event.currentTarget === this.element){
            this.view.mouseExited(JSEvent.alloc.initWithDOMEvent(event));
        }
    },
    
    // -------------------------------------------------------------------------
    // MARK: - JSViewRenderDelegate
    
    viewDidAddSubview: function(view, subview){
        var parentNode = this.element;
        var subviewNode = subview._renderDelegate.element;
        var childNodeIndex = this.firstSubviewNodeIndex + subview.level;
        if (childNodeIndex < this.childNodes.length){
            var siblingNode = parentNode.childNodes.item(childNodeIndex);
            parnetNode.insertBefore(subviewNode, siblingNode);
        }else{
            parentNode.appendChild(subviewNode);
        }
    },
    
    viewDidRemoveSubview: function(view, subview){
        this.element.removeChild(subview._renderDelegate.element);
    },
    
    viewDidChangeFrame: function(view){
        this._resize(view);
    },
    
    viewDidChangeAutoresizingMask: function(view){
        this._resize(view);
    },
    
    viewDidChangeHidden: function(view){
        if (view.hidden){
            this._unhiddenDisplayStyle = this.element.style.display;
            this.element.style.display = 'none';
        }else{
            this.element.style.display = this._unhiddenDisplayStyle;
        }
    },
    
    viewDidChangeAlpha: function(view){
        this.element.style.opacity = view.alpha;
    },
    
    // -------------------------------------------------------------------------
    // MARK: - Resizing
    
    _resize: function(view){
        /*
        var positions = {};
        if (view.superview){
            if (!(view.autoresizingMask & JSViewAutoresizingFlexibleTopMargin)){
                positions.top = view.frame.origin.y;
            }
            if (!(view.autoresizingMask & JSViewAutoresizingFlexibleLeftMargin)){
                positions.left = view.frame.origin.x;
            }
            if (!(view.autoresizingMask & JSViewAutoresizingFlexibleRightMargin)){
                if (this.positions.right !== undefined){
                    positions.right = this.positions.right;
                }else{
                    positions.right = (view.superview.frame.size.width - view.frame.origin.x - view.frame.size.width);
                }
            }
            if (!(view.autoresizingMask & JSViewAutoresizingFlexibleBottomMargin)){
                if (this.positions.bottom !== undefined){
                    positions.bottom = this.positions.bottom;
                }else{
                    positions.bottom = (view.superview.frame.size.heiht - view.frame.origin.y - view.frame.size.height);
                }
            }
        }
        if (!(view.autoresizingMask & JSViewAutoresizingFlexibleWidth)){
            positions.width = view.frame.size.width;
        }
        if (!(view.autoresizingMask & JSViewAutoresizingFlexibleHeight)){
            positions.height = view.frame.size.height;
        }
        */
        var positions = {};
        if (view.frame.y  !== undefined) positions.top      = view.frame.y;
        if (view.frame.x2 !== undefined) positions.right    = view.frame.x2;
        if (view.frame.y2 !== undefined) positions.bottom   = view.frame.y2;
        if (view.frame.x  !== undefined) positions.left     = view.frame.x;
        if (view.frame.width  !== undefined) positions.width    = view.frame.width;
        if (view.frame.height !== undefined) positions.height   = view.frame.height;
        if (positions.left !== undefined && positions.width !== undefined && positions.right !== undefined){
            delete positions.right;
        }
        if (positions.top !== undefined && positions.height !== undefined && positions.botom !== undefined){
            delete positions.bottom;
        }
        for (var position in positions){
            this.element.style[position] = positions[position] + 'px';
            if (position in this.positions){
                delete this.positions[position];
            }
        }
        for (var position in this.positions){
            this.element.style[position] = '';
        }
        this.positions = positions;
    }
    
};

JSHTMLViewRenderDelegate.$extends(JSObject).$implements(JSViewRenderDelegate);

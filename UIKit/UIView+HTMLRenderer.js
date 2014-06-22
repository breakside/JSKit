UIView.HTMLRenderer = JSObject.$extend({

    element                 : null,
    firstSubviewNodeIndex   : 0,
    positions               : null,
    drawMethodMap           : null,

    // -------------------------------------------------------------------------
    // MARK: - Initialization

    init: function(){
        this.initWithElementName('div');
    },

    initWithElementName: function(elementName){
        UIView.HTMLRenderer.$super.init.call(this);
        this.drawMethodMap = {
            'frame': '_resize',
            'center': '_resize',
            'transform': '_drawTransform',
            'opacity': '_drawOpacity',
            'hidden': '_drawHidden',
            'backgroundColor': '_drawBackgroundColor',
            'borderWidth': '_drawBorderWidth',
            'borderColor': '_drawBorderColor',
            'borderRadius': '_drawBorderRadius',
            'shadowOffset': '_drawShadow',
            'shadowColor': '_drawShadow',
            'shadowRadius': '_drawShadow'
        };
        this.element = document.createElement(elementName);
        this.setupElement();
        this.positions = {};
    },

    setupElement: function(){
        this.element.style.position = 'absolute';
        this.element.style.boxSizing = 'border-box';
        this.element.style.mozBoxSizing = 'border-box';
    },

    // -------------------------------------------------------------------------
    // MARK: - Events

    handleEvent: function(domEvent){
        if (domEvent.type == 'mousedown'){
            this.view.mouseDown(UIEvent.initWithDOMEvent(domEvent));
        }else if (domEvent.type == 'mouseup'){
            this.view.mouseUp(UIEvent.initWithDOMEvent(domEvent));
        }else if (domEvent.type == 'mouseover' && domEvent.currentTarget === this.element){
            this.view.mouseEntered(UIEvent.initWithDOMEvent(domEvent));
        }else if (domEvent.type == 'mouseout' && domEvent.currentTarget === this.element){
            this.view.mouseExited(UIEvent.initWithDOMEvent(domEvent));
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - UIView.RenderProtocol

    viewCanStartReceivingEvents: function(view){
        var methodEventMap = {
            'mouseDown'     : 'mousedown',
            'mouseUp'       : 'mouseup',
            'mouseMoved'    : 'mousemove',
            'mouseEntered'  : 'mouseover',
            'mouseExited'   : 'mouseout'
        };
        for (var method in methodEventMap){
            if (method in view){
                this.element.addEventListener(methodEventMap[method], this, false);
            }
        }
    },

    viewDidAddSubview: function(view, subview){
        var parentNode = this.element;
        var subviewNode = subview.renderer.element;
        var childNodeIndex = this.firstSubviewNodeIndex + subview.level;
        if (childNodeIndex < parentNode.childNodes.length){
            var siblingNode = parentNode.childNodes.item(childNodeIndex);
            parnetNode.insertBefore(subviewNode, siblingNode);
        }else{
            parentNode.appendChild(subviewNode);
        }
    },

    viewDidRemoveSubview: function(view, subview){
        this.element.removeChild(subview.renderer.element);
    },

    // -------------------------------------------------------------------------
    // MARK: - Resizing

    _resize: function(view){
        var box = view.rendererValueForKey('constraintBox');
        if (!box){
            box = JSConstraintBox.Rect(view.rendererValueForKey('frame'));
        }
        for (var property in box){
            if (box[property] === undefined){
                this.element.style[property] = '';
            }else{
                this.element.style[property] = box[property] + 'px';
            }
        }
    },


    // -------------------------------------------------------------------------
    // MARK: - Drawing

    drawView: function(view){
        var called = {};
        for (var property in view.propertiesNeedingDisplay){
            var method = this.drawMethodMap[property];
            if (!(method in called) && method in this){
                this[method](view);
                called[method] = true;
            }
        }
    },

    _drawHidden: function(view){
        if (view.hidden){
            this._unhiddenDisplayStyle = this.element.style.display;
            this.element.style.display = 'none';
        }else{
            this.element.style.display = this._unhiddenDisplayStyle;
        }
    },

    _drawOpacity: function(view){
        this.element.style.opacity = view.rendererValueForKey('opacity');
    },

    _drawBackgroundColor: function(view){
        var backgroundColor = view.rendererValueForKey('backgroundColor');
        if (backgroundColor){
            this.element.style.backgroundColor = backgroundColor.cssString();
        }else{
            this.element.style.backgroundColor = '';
        }
    },

    _drawBorderWidth: function(view){
        this.element.style.borderWidth = view.rendererValueForKey('borderWidth') + 'px';
        this.element.style.borderStyle = 'solid';
    },

    _drawBorderColor: function(view){
        var borderColor = view.rendererValueForKey('borderColor');
        if (borderColor){
            this.element.style.borderColor = borderColor.cssString();
        }else{
            this.element.style.borderColor = 'transparent';
        }
    },

    _drawShadow: function(view){
        var color = view.rendererValueForKey('shadowColor');
        var radius = view.rendererValueForKey('shadowRadius');
        var offset = view.rendererValueForKey('shadowOffset');
        if (color && (radius || offset.x || offset.y)){
            this.element.style.boxShadow = '%dpx %dpx %dpx %s'.sprintf(offset.x, offset.y, radius, color.cssString());
        }else{
            this.element.style.boxShadow = '';
        }
    },

    _drawTransform: function(view){
        var transform = view.rendererValueForKey('transform');
        if (transform){
            this.element.style.webkitTransform = this.element.style.MozTransform = 'matrix(%d, %d, %d, %d, %d, %d)'.sprintf(transform.a, transform.b, transform.c, transform.d, transform.tx, transform.ty);
        }else{
            this.element.style.webkitTransform = this.element.style.MozTransform = '';
        }
    },

    _drawBorderRadius: function(view){
        var radius = view.rendererValueForKey('borderRadius');
        if (radius){
            this.element.style.borderRadius = radius + 'px';
        }else{
            this.element.style.borderRadius = '';
        }
    }

}, 'UIView.HTMLRenderer');

UIView.HTMLRenderer.matchesCurrentEnvironment = function(){
    return UIViewRenderingEnvironment == 'HTML';
};

UIView.registerRenderer(UIView.HTMLRenderer);

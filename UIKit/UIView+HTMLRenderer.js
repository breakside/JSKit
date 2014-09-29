UIView.HTMLRenderer = JSObject.$extend({

    view                    : null,
    element                 : null,
    firstSubviewNodeIndex   : 0,
    positions               : null,
    drawMethodMap           : null,

    // -------------------------------------------------------------------------
    // MARK: - Initialization

    initWithView: function(view){
        this.initWithElementName(view, 'div');
    },

    initWithElementName: function(view, elementName){
        UIView.HTMLRenderer.$super.init.call(this);
        this.view = view;
        this.drawMethodMap = {
            'center': 'layoutView',
            'frame': 'layoutView',
            'constraintBox': 'layoutView',
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
        this.element.style.boxSizing = 'border-box';
        this.element.style.mozBoxSizing = 'border-box';
        this.element.setAttribute('UIViewClass', this.view.$class.className);
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
        subviewNode.style.position = 'absolute';
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
    // MARK: - Layout

    layoutView: function(view){
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
        if (box.left === undefined && box.right === undefined){
            var width = box.width;
            if (width === undefined){
                width = view.rendererValueForKey('frame').size.width;
            }
            this.element.style.left = '50%';
            this.element.style.marginLeft = (-width) + 'px';
        }else{
            this.element.style.marginLeft = '';
        }
        if (box.top === undefined && box.bottom === undefined){
            var height = box.height;
            if (height === undefined){
                height = view.rendererValueForKey('frame').size.height;
            }
            this.element.style.top = '50%';
            this.element.style.marginTop = (-height) + 'px';
        }else{
            this.element.style.marginTop = '';
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

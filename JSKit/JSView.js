// #import "Foundation/Foundation.js"
// #import "Foundation/CoreTypes.js"
// #import "Foundation/JSObject.js"
// #import "JSKit/JSViewRenderDelegate.js"

/* REMOVE IF new rect style works better
JSViewNotSizable                                                = 0;    // fixed size + position
JSViewMinXMargin    = JSViewAutoresizingFlexibleLeftMargin      = 1;    // Left margin is flexible
JSViewWidthSizable  = JSViewAutoresizingFlexibleWidth           = 2;    // Width is flexible
JSViewMaxXMargin    = JSViewAutoresizingFlexibleRightMargin     = 4;    // Right margin is flexible
JSViewMinYMargin    = JSViewAutoresizingFlexibleBottomMargin    = 8;    // Bottom margin is flexible
JSViewHeightSizable = JSViewAutoresizingFlexibleHeight          = 16;   // Height is flexible
JSViewMaxYMargin    = JSViewAutoresizingFlexibleTopMargin       = 32;   // Top margin is flexible

JSViewAutoresizingFill      = JSViewAutoresizingFlexibleWidth       | JSViewAutoresizingFlexibleHeight;
JSViewAutoresizingCenterX   = JSViewAutoresizingFlexibleLeftMargin  | JSViewAutoresizingFlexibleRightMargin;
JSViewAutoresizingCenterY   = JSViewAutoresizingFlexibleTopMargin   | JSViewAutoresizingFlexibleBottomMargin;
JSViewAutoresizingCenter    = JSViewAutoResizingCenterX             | JSViewAutoResizingCenterY;
*/

function JSView(){
}

JSView.alowedRenderDelegateTypes = [JSViewRenderDelegateTypeHTML5];
isIE6 = window.navigator.userAgent.match(/IE 6/);
if (isIE6){
    JSView.alowedRenderDelegateTypes.splice(0,JSViewRenderDelegateTypeIE6);
}

JSView.prototype = {

    // -------------------------------------------------------------------------
    // MARK: - Properties

    window                  : null,      // JSWindow
    superview               : null,      // JSView
    level                   : null,      // int
    subviews                : null,      // Array

    frame                   : null,      // JSRect
    
    _renderDelegateProtocol : JSViewRenderDelegate,
    _renderDelegate         : null,

    // -------------------------------------------------------------------------
    // MARK: - Initialization
    
    init: function(){
        return this.initWithFrame(JSRectMake(0,0,0,0));
    },

    initWithFrame: function(frame){
        this.$super.init.call(this);
        this._initWithFrame(frame);
        return this;
    },
    
    _initWithFrame: function(frame){
        this.subviews = [];
        this.frame = frame;
        this._initRenderDelegate();
    },
    
    initWithSpec: function(spec){
        this.$super.initWithSpec.call(this, spec);
        var frame;
        if ("frame" in spec){
            frame = JSRectMake.apply(JSRectMake, frame.spec.parseNumberArray());
        }else{
            frame = JSRectMake(0,0,0,0);
        }
        this._initWithFrame(frame);
        if ("subviews" in spec){
            for (var i = 0, l = spec.subviews.length; i < l; ++i){
                this.addSubview(spec.subviews[i]);
            }
        }
        return this;
    },
    
    _initRenderDelegate: function(){
        var allowedRenderDelegates = JSView.alowedRenderDelegateTypes.slice();
        while (!this._renderDelegate && allowedRenderDelegates.length){
            this._renderDelegate = this._renderDelegateProtocol.delegateOfTypeForView(allowedRenderDelegates.pop());
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Adding and Removing Subviews

    addSubview: function(subview){
        return this.insertSubviewAtIndex(this.subviews.length);
    },

    insertSubviewAtIndex: function(subview, index){
        if (subview.superview === this){
            for (var i = subview.level + 1, l = this.subviews.length; i < l; ++i){
                this.subviews[i].level -= 1;
            }
            this.subviews.splice(subview.level,1);
            if (index > subview.level){
                --index;
            }
        }
        this.subviews.splice(index, 0, subview);
        for (var i = level + 1, l = this.subviews.length; i < l; ++i){
            this.subviews[i].level += 1;
        }
        subview.superview = this;
        subview.setWindow(this.window);
        subview.level = index;
        this._renderDelegate.viewDidAddSubview(view, subview);
        return subview;
    },

    insertSubviewBeforeSibling: function(subview, sibling){
        if (sibling.superview !== this){
            throw Error('Cannot insert subview [%s] in view [%s] because sibling view [%s] is not a valid subview.');
        }
        return this.insertSubviewAtIndex(sibling.level);
    },

    insertSubviewAfterSibling: function(subview, sibling){
        if (sibling.superview !== this){
            throw Error('Cannot insert subview [%s] in view [%s] because sibling view [%s] is not a valid subview.');
        }
        return this.insertSubviewAtIndex(sibling.level + 1);
    },
    
    removeSubview: function(subview){
        if (subview.superview === this){
            for (var i = subview.level + 1, l = this.subviews.length; i < l; ++i){
                this.subviews[i].level -= 1;
            }
            this._renderDelegate.viewDidRemoveSubview(this, subview);
            this.subviews.splice(subview.level,1);
            subview.superview = null;
            subview.setWindow(null);
            subview.level = null;
        }
    },
    
    removeFromSuperview: function(){
        if (this.superview){
            this.superview.removeSubview(this);
        }
    },
    
    removeAllSubviews: function(){
        for (int i = 0, l = this.subviews.length; i < l; ++i){
            this.subview.removeFromSuperview();
        }
        this.subviews = [];
    },
    
    // -------------------------------------------------------------------------
    // MARK: - Size and Layout
    
    setFrame: function(frame){
        this.frame = frame;
        this._renderDelegate.viewDidChangeFrame(this);
    },
    
    setHidden: function(hidden){
        this.hidden = hidden;
        this._renderDelegate.viewDidChangeHidden(this);
    },
    
    setAlpha: function(alpha){
        this.alpha = alpha;
        this._renderDelegate.viewDidChangeAlpha(this);
    },
    
    // -------------------------------------------------------------------------
    // MARK: - Window
    
    setWindow: function(window){
        if (window != this.window){
            this.window = window;
            for (var i = 0, l = this.subviews.length; i < l; ++i){
                this.subviews[i].setWindow(this.window);
            }
        }
    },

};

JSView.$extends(JSObject);

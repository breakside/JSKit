// #import "JSKit/JSHTMLViewRenderDelegate.js" /delay

JSViewRenderDelegateTypeHTML5   = 1;
JSViewRenderDelegateTypeIE6     = 2;

function JSViewRenderDelegate(){
}

JSViewRenderDelegate.renderDelegatesByType = {};

JSViewRenderDelegate.subclassDidImplement = function(subclass){
    this.renderDelegatesByType[subclass.renderDelegateType] = subclass;
};

JSViewRenderDelegate.subclassDidExtend = function(subclass){
    subclass.renderDelegatesByType = {};
    subclass.subclassDidImplement = this.subclassDidImplement;
    subclass.subclassDidExtend = this.subclassDidExtend;
    subclass.delegateOfTypeForView = this.delegateOfTypeForView;
};

JSViewRenderDelegate.delegateOfTypeForView = function(type){
    if (this.renderDelegatesByType[type]){
        return this.renderDelegatesByType[type].alloc.init();
    }
};

JSViewRenderDelegate.prototype = {
    
    viewCanStartReceivingEvents:    ['view'],
    viewDidAddSubview:              ['view', 'subview'],
    viewDidRemoveSubview:           ['view', 'subview'],
    viewDidChangeFrame:             ['view'],
    viewDidChangeAutoresizingMask:  ['view'],
    viewDidChangeHidden:            ['view'],
    viewDidChangeAlpha:             ['view'],
    
};

JSViewRenderDelegate.$extends(JSObject);

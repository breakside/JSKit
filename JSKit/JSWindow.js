// #import "JSKit/JSView.js"
// #import "JSKit/JSWindowRenderDelegate.js"
// #import "Foundation/CoreTypes.js"

function JSWindow(){
}

JSWindow.prototype = {
    
    _renderDelegateProtocol : JSWindowRenderDelegate,
    view: null,
    rootViewController: null,
    
    init: function(){
        this.$super.initWithFrame.call(this,JSRectMakeWithMargin(0));
        this.view = JSView.alloc.initWithFrame(JSRectMakeWithMargin(0));
        this.window = this;
        this.addSubview(this.view);
        return this;
    },
    
    setRootViewController: function(viewController){
        this.rootViewController = viewController;
        this.view.removeAllSubviews();
        this.view.addSubview(this.rootViewController.view);
    },
    
};

JSWindow.$extends(JSView);

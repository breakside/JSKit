// #import "UIKit/UIView.js"
// #import "Foundation/CoreTypes.js"
// #import "UIKit/UIWindow+HTMLRenderer.js" /delay

JSClass('UIWindow', UIView, {

    view: null,
    rootViewController: null,

    init: function(){
        UIWindow.$super.initWithFrame.call(this, JSRect(0,0,500,500));
        this.window = this;
    },

    setRootViewController: function(viewController){
        this.rootViewController = viewController;
        this.view.removeAllSubviews();
        this.view.addSubview(this.rootViewController.view);
    }

});

UIWindow.RenderProtocol = UIView.RenderProtocol.$extend({});
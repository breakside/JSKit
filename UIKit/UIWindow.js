// #import "UIKit/UIView.js"
// #import "Foundation/CoreTypes.js"
// #import "UIKit/UIWindow+HTMLRenderer.js" /delay

JSClass('UIWindow', UIView, {

    contentView: null,

    init: function(){
        UIWindow.$super.initWithConstraintBox.call(this, JSConstraintBox.Margin(0));
        this.window = this;
        this.contentView = UIView.initWithConstraintBox(JSConstraintBox.Margin(0));
        this.addSubview(this.contentView);
    }

});

UIWindow.RenderProtocol = UIView.RenderProtocol.$extend({});
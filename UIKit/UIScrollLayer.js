// #import "UIKit/UILayer.js"

JSClass("UIScrollLayer", UILayer, {
    scrollVertically: true,
    scrollHorizontally: true
});

UIScrollLayer.Properties = Object.create(UILayer.Properties);
UIScrollLayer.Properties.contentOffset = JSPoint.Zero;
UIScrollLayer.Properties.contentSize = JSSize.Zero;
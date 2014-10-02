// #import "UIKit/UILayer.js"

JSClass("UITextLayer", UILayer, {
    text: null,
    textColor: UILayerAnimatedProperty(),
    font: null
});

UITextLayer.Properties = Object.create(UILayer.Properties);
UITextLayer.Properties.textColor = null;
// #import "UIKit/UILayer.js"

JSClass("UITextLayer", UILayer, {
    text: null,
    textColor: null,
    font: null
});

UITextLayer.Properties = Object.create(UILayer.Properties);
UITextLayer.Properties.textColor = null;

UITextLayer.defineAnimatedPropertyForKey('textColor');
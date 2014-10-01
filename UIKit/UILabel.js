// #import "UIKit/UIView.js"
// #import "UIKit/UITextLayer.js"

JSClass('UILabel', UIView, {
});

UILabel.layerClass = UITextLayer;

UILabel.defineLayerProperty('text');
UILabel.defineLayerProperty('textColor');
UILabel.defineLayerProperty('font');

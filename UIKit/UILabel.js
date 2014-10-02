// #import "UIKit/UIView.js"
// #import "UIKit/UITextLayer.js"

JSClass('UILabel', UIView, {

    text: UIViewLayerProperty(),
    textColor: UIViewLayerProperty(),
    font: UIViewLayerProperty()

});

UILabel.layerClass = UITextLayer;
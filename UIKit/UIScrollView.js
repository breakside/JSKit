// #import "UIKit/UIView.js"
// #import "UIKit/UIScrollLayer.js"

JSClass('UIScrollView', UIView, {

    contentOffset: UIViewLayerProperty(),
    contentSize: UIViewLayerProperty(),

    setContentOffsetAnimated: function(contentOffset){
        var scrollView = this;
        UIView.animateWithDuration(0.25, function(){
            scrollView.contentOffset = contentOffset;
        });
    }

});

UIScrollView.layerClass = UIScrollLayer;
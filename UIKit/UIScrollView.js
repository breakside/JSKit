// #import "UIKit/UIView.js"
// #import "UIKit/UIScrollLayer.js"

JSClass('UIScrollView', UIView, {

    setContentOffsetAnimated: function(contentOffset){
        var scrollView = this;
        UIView.animateWithDuration(0.25, function(){
            scrollView.contentOffset = contentOffset;
        });
    }

});

UILabel.defineLayerProperty('contentSize');
UILabel.defineLayerProperty('contentOffset');

UIScrollView.layerClass = UIScrollLayer;
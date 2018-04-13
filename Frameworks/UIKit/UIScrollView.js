// #import "UIKit/UIView.js"
// #import "UIKit/UIScrollLayer.js"
/* global JSClass, UIView, UIScrollView, UIScrollLayer, UIViewLayerProperty */
'use strict';

JSClass('UIScrollView', UIView, {

    contentOffset: UIViewLayerProperty(),
    contentSize: UIViewLayerProperty(),
    delaysContentTouches: false,

    _commonViewInit: function(){
        UIScrollView.$super._commonViewInit.call(this);
        this.clipsToBounds = true;
    },

    setContentOffsetAnimated: function(contentOffset){
        var scrollView = this;
        UIView.animateWithDuration(0.25, function(){
            scrollView.contentOffset = contentOffset;
        });
    },

    hitTest: function(locationInView){
        if (this.delaysContentTouches){
            return this;
        }
        return UIScrollView.$super.hitTest.call(this, locationInView);
    }

});

UIScrollView.layerClass = UIScrollLayer;
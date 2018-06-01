// #import "UIKit/UIView.js"
// #import "UIKit/UIScrollLayer.js"
/* global JSClass, UIView, UIScrollView, UIScrollLayer, UIViewLayerProperty, JSInsets, JSProtocol */
'use strict';

JSProtocol("UIScrollViewDelegate", JSProtocol, {

    scrollViewDidScroll: ['scrollView']

});

JSClass('UIScrollView', UIView, {

    delegate: null,
    contentInsets: UIViewLayerProperty(),
    contentOffset: UIViewLayerProperty(),
    contentSize: UIViewLayerProperty(),
    delaysContentTouches: false,

    initWithSpec: function(spec, values){
        UIScrollView.$super.initWithSpec.call(this, spec, values);
        if ('contentInsets' in values){
            this.contentInsets = JSInsets.apply(undefined, values.contentInsets.parseNumberArray());
        }
    },

    scrollLayerDidScroll: function(layer){
        this._didScroll();
    },

    _didScroll: function(){
        if (this.delegate && this.delegate.scrollViewDidScroll){
            this.delegate.scrollViewDidScroll(this);
        }
    },

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
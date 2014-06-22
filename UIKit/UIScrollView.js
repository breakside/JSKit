// #import "UIKit/UIView.js"

JSClass('UIScrollView', UIView, {

    contentSize: null,
    contentOffset: null,

    setContentSize: function(contentSize){
        this._contentSize = contentSize;
        this._setNeedsPropertyDisplay('contentSize');
    },

    setContentOffset: function(contentOffset){
        this._contentOffset = contentOffset;
        this._setNeedsPropertyDisplay('contentOffset');
    },

    setContentOffsetAnimated: function(contentOffset){
        var scrollView = this;
        UIView.animateWithDuration(0.25, function(){
            scrollView.contentOffset = contentOffset;
        });
    }

});
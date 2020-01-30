// #import "UIUserInterface.js"
'use strict';

JSClass("UITraitCollection", JSObject, {

    initWithSize: function(size){
        this.horizontalSizeClass = UIUserInterface.SizeClass.fromLength(size.width);
        this.verticalSizeClass = UIUserInterface.SizeClass.fromLength(size.height);
    },

    horizontalSizeClass: UIUserInterface.SizeClass.unspecified,
    verticalSizeClass: UIUserInterface.SizeClass.unspecified,

    isEqual: function(other){
        if (this.horizontalSizeClass !== other.horizontalSizeClass){
            return false;
        }
        if (this.verticalSizeClass !== other.verticalSizeClass){
            return false;
        }
        return true;
    }

});
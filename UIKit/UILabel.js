// #import "UIKit/UIView.js"
// #import "UIKit/UILabel+HTMLRenderer.js" /delay

JSClass('UILabel', UIView, {

    text: null,
    textColor: null,

    setText: function(text){
        this._text = text;
        this._setNeedsPropertyDisplay('text');
    }

});

UIView.defineAnimatableProperty('textColor');
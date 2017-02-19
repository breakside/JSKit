// #import "UIKit/UITextInputManager.js"
/* global JSClass, UITextInputManager */
'use strict';

JSClass('UIHTMLTextInputManager', UITextInputManager, {

    rootElement: null,

    initWithRootElement: function(rootElement){
        this.rootElement = rootElement;
    }

});
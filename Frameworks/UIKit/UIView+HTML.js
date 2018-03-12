// #import "UIKit/UIView.js"
// #import "UIKit/UIWindowServer.js"
/* global UIView, UIWindowServer */
'use strict';

UIView.definePropertiesFromExtensions({

    setCursor: function(cursor){
        this._cursor = cursor;
        UIWindowServer.defaultServer.viewDidChangeCursor(this);
    }

});
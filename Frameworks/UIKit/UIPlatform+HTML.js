// #import "UIPlatform.js"
// jshint browser: true
'use strict';

(function(){

var mac = navigator.userAgent.indexOf("Macintosh") >= 0;
var iphone = navigator.userAgent.indexOf("iPhone") >= 0;

if (mac || iphone){
    UIPlatform.shared = UIPlatform.initWithIdentifier(UIPlatform.Identifier.mac);
}else{
    UIPlatform.shared = UIPlatform.initWithIdentifier(UIPlatform.Identifier.win);
}

})();
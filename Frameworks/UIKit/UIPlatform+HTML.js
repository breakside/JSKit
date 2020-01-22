// #import "UIPlatform.js"
// jshint browser: true
'use strict';

(function(){

if (navigator.userAgent.indexOf("Macintosh") >= 0){
    UIPlatform.shared = UIPlatform.initWithIdentifier(UIPlatform.Identifier.mac);
}else{
    UIPlatform.shared = UIPlatform.initWithIdentifier(UIPlatform.Identifier.win);
}

})();
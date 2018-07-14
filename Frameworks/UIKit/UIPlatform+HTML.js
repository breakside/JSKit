// #import "UIKit/UIPlatform.js"
/* global navigator, UIPlatform */
'use strict';

(function(){

if (navigator.userAgent.indexOf("Macintosh") >= 0){
    UIPlatform.shared = UIPlatform.initWithIdentifier(UIPlatform.Identifier.mac);
}else{
    UIPlatform.shared = UIPlatform.initWithIdentifier(UIPlatform.Identifier.win);
}

})();
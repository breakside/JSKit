// #import "UIDevice.js"
// #feature window.matchMedia
// jshint browser: true
'use strict';

(function(){

var device = UIDevice.init();

device.supportsTouchInput = ('ontouchstart' in document.body) && navigator.maxTouchPoints > 0;
var primaryPointerHovers = window.matchMedia('(hover)').matches;
var primaryFinePointer = window.matchMedia('(pointer: fine)').matches;

if (primaryFinePointer){
    device.primaryPointerAccuracy = UIUserInterface.PointerAccuracy.fine;
    if (primaryPointerHovers){
        device.primaryPointerType = UIUserInterface.PointerType.cursor;
    }else{
        device.primaryPointerType = UIUserInterface.PointerType.touch;
    }
}else if (device.supportsTouchInput){
    device.primaryPointerAccuracy = UIUserInterface.PointerAccuracy.coarse;
    device.primaryPointerType = UIUserInterface.PointerType.touch;
}

UIDevice.shared = device;

})();
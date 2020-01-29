// #import Foundation
// #import "UIUserInterface.js"
'use strict';

JSClass("UIDevice", JSObject, {

    primaryPointerType: UIUserInterface.PointerType.unspecified,
    primaryPointerAccuracy: UIUserInterface.PointerAccuracy.unspecified,
    supportsTouchInput: false

});

UIDevice.shared = null;
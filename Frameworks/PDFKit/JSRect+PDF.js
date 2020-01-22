// #import Foundation
'use strict';

Object.defineProperties(JSRect.prototype, {
    pdfRectangle: {
        enumerable: false,
        configurable: false,
        value: function JSRect_pdfRectangle(){
            return [this.origin.x, this.origin.y, this.origin.x + this.size.width, this.origin.y + this.size.height];
        }
    }
});
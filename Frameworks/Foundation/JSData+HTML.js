// #import "Foundation/JSData.js"
// #feature Blob
// #feature URL.createObjectURL
/* global JSData, Blob, URL */
'use strict';

Object.defineProperties(JSData.prototype, {

    htmlURLString: {
        value: function JSData_htmlURLString(){
            if (!this._blob){
                this._blob = new Blob([this]);
                this._blobURL = URL.createObjectURL(this._blob);
                // FIXME: should try to revokeObjectURL when no longer needed
            }
            return this._blobURL;
        }
    }
});
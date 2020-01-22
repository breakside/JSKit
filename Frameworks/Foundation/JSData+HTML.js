// #import "JSData.js"
// #feature Blob
// #feature URL.createObjectURL
// jshint browser: true
'use strict';

Object.defineProperties(JSData.prototype, {

    htmlURLString: {
        value: function JSData_htmlURLString(){
            if (!this._blobURL){
                this._blob = new Blob([this]);
                this._blobURL = URL.createObjectURL(this._blob);
            }
            return this._blobURL;
        }
    },

    htmlCleanup: {
        value: function JSData_htmlCleanup(){
            if (this._blobURL){
                URL.revokeObjectURL(this._blobURL);
                delete this._blobURL;
                delete this._blob;
            }
        }
    }
});
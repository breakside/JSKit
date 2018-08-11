// #import "Foundation/JSData.js"
// #feature Blob
// #feature URL.createObjectURL
/* global JSData, Blob, URL */
'use strict';

JSData.definePropertiesFromExtensions({

    htmlURLString: function(){
        if (!this._blob){
            this._blob = Blob([this.bytes]);
            this._blobURL = URL.createObjectURL(this._blob);
            // FIXME: should try to revokeObjectURL when no longer needed
        }
        return this._blobURL;
    }
});
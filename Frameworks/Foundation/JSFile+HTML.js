// #import "JSFile.js"
// #import "JSURL.js"
/* feature URL.revokeObjectURL */
/* global URL, JSClass, JSFile, JSDataFile, JSURL */
'use strict';

(function(){

var originalClose = JSDataFile.prototype.close;

JSDataFile.definePropertiesFromExtensions({

    _dataURL: null,

    close: function(){
        originalClose.call(this);
        if (this._dataURL !== null){
            URL.revokeObjectURL(this._dataURL);
        }
    },

    getURL: function(){
        if (this._dataURL === null){
            var urlString = this._data.htmlURLString();
            this._dataURL = JSURL.initWithString(urlString);
        }
        return this._dataURL;
    }
});

})();
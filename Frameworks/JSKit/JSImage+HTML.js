// #import "JSKit/JSImage.js"
// #feature URL.createObjectURL
/* global JSImage, URL */
'use strict';

JSImage.definePropertiesFromExtensions({
    htmlURLString: function(){
        if (this.resource){
            return this.resource.url;
        }
        if (this.file){
            if (!this._fileURL){
                this._fileURL = URL.createObjectURL(this.file);
            }
            return this._fileURL;
        }
        if (this.data){
            return this.data.htmlURLString();
        }
    }
});
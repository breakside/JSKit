// #import "Foundation/JSImage.js"
// #feature URL.createObjectURL
/* global JSImage, URL, window */
'use strict';

JSImage.definePropertiesFromExtensions({
    htmlURLString: function(){
        if (this.url){
            return this.url;
        }
        if (this.resource){
            return this.resource.image.url;
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
        return null;
    },

    preferredScale: function(){
        return window.devicePixelRatio || 1;
    }
});
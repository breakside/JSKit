// #import "Foundation/JSImage.js"
// #feature URL.createObjectURL
/* global JSImage, _JSResourceImage, _JSDataImage, _JSURLImage, URL, window, JSURLSession, JSURLResponse */
'use strict';

_JSResourceImage.definePropertiesFromExtensions({
    htmlURLString: function(){
        return this.resource.image.url;
    },

    preferredScale: function(){
        return window.devicePixelRatio || 1;
    }
});

_JSDataImage.definePropertiesFromExtensions({
    htmlURLString: function(){
        return this.data.htmlURLString();
    }
});

_JSURLImage.definePropertiesFromExtensions({
    htmlURLString: function(){
        return this.url;
    }
});
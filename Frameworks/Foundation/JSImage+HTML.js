// #import "Foundation/JSImage.js"
/* global JSImage, _JSResourceImage, _JSDataImage, _JSURLImage */
'use strict';

_JSResourceImage.definePropertiesFromExtensions({
    htmlURLString: function(){
        return this.metadata.htmlURL;
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
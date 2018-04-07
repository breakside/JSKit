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
    },

    getData: function(callback){
        var session = JSURLSession.sharedSession;
        var task = session.dataTaskWithURL(this.resource.image.url, function(error){
            if (error !== null){
                callback(null);
            }
            var response = task.response;
            if (response.statusClass != JSURLResponse.StatusClass.success){
                callback(null);
            }
            callback(response.data);
        });
        task.resume();
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
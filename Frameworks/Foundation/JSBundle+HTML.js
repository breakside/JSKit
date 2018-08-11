// #import "Foundation/JSBundle.js"
// #import "Foundation/JSURLSession.js"
// #import "Foundation/JSURLResponse.js"
/* global JSBundle, JSURLSession, JSURLResponse, JSURL */
'use strict';

JSBundle.definePropertiesFromExtensions({
    getResourceData: function(metadata, callback, target){
        var session = JSURLSession.shared;
        var url = JSURL.initWithString(metadata.htmlURL);
        var task = session.dataTaskWithURL(url, function(error){
            if (error !== null || task.response.statusClass != JSURLResponse.StatusClass.success){
                callback.call(target, null);
            }
            callback.call(target, task.response.data);
        });
        task.resume();
    }
});
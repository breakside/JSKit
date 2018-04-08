// #import "Foundation/JSBundle.js"
// #import "Foundation/JSURLSession.js"
// #import "Foundation/JSURLResponse.js"
/* global JSBundle, JSURLSession, JSURLResponse, JSURL */
'use strict';

JSBundle.definePropertiesFromExtensions({
    getResourceData: function(metadata, callback){
        var session = JSURLSession.sharedSession;
        var url = JSURL.initWithString(metadata.htmlURL);
        var task = session.dataTaskWithURL(url, function(error){
            if (error !== null || task.response.statusClass != JSURLResponse.StatusClass.success){
                callback(null);
            }
            callback(task.response.data);
        });
        task.resume();
    }
});
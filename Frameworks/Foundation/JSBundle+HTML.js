// #import "JSBundle.js"
// #import "JSURLSession.js"
// #import "JSURLResponse.js"
/* global JSBundle, JSURLSession, JSURLResponse, JSURL */
'use strict';

JSBundle.definePropertiesFromExtensions({
    getResourceData: function(metadata, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var session = JSURLSession.shared;
        var url = JSURL.initWithString(metadata.htmlURL);
        var task = session.dataTaskWithURL(url, function(error){
            if (error !== null || task.response.statusClass != JSURLResponse.StatusClass.success){
                completion.call(target, null);
            }
            completion.call(target, task.response.data);
        });
        task.resume();
        return completion.promise;
    }
});
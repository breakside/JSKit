// #import "JSURLSession.js"
// #import "JSNodeURLSessionDataTask.js"
// #import "JSNodeURLSessionUploadTask.js"
// #import "JSNodeURLSessionStreamTask.js"
'use strict';

JSURLSession.definePropertiesFromExtensions({
    dataTaskClass: JSNodeURLSessionDataTask,
    uploadTaskClass: JSNodeURLSessionUploadTask,
    streamTaskClass: JSNodeURLSessionStreamTask
});
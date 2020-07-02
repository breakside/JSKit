// #import "JSURLSession.js"
// #import "JSHTMLURLSessionDataTask.js"
// #import "JSHTMLURLSessionUploadTask.js"
// #import "JSHTMLURLSessionStreamTask.js"
'use strict';

JSURLSession.definePropertiesFromExtensions({
    dataTaskClass: JSHTMLURLSessionDataTask,
    uploadTaskClass: JSHTMLURLSessionUploadTask,
    streamTaskClass: JSHTMLURLSessionStreamTask
});
// #import "Foundation/JSLog.js"
/* global JSLog, global */
'use strict';

global.jslog_create = function(tag){
    return new JSLog(tag);
};
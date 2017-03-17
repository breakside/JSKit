'use strict';
/* global console */

function jslog_create(tag){
    return new JSLog(tag);
}

function JSLog(tag){
    if (this === undefined){
        return new JSLog(tag);
    }
    this.tag = tag;
}

JSLog.buffer = [];
JSLog.remember = function(tag, level, message){
    if (JSLog.buffer.length >= 50){
        JSLog.buffer.shift();
    }
    JSLog.buffer.push({tag: tag, level: level, message: message});
};

JSLog.prototype = {

    info: function(message){
        JSLog.remember(this.tag, 'info', message);
    },

    log: function(message){
        JSLog.remember(this.tag, 'log', message);
    },

    warn: function(messageOrError){
        var message;
        var error;
        if (messageOrError instanceof Error){
            error = messageOrError;
            message = error.toString();
        }else{
            message = messageOrError;
        }
        JSLog.remember(this.tag, 'warn', message);
        // TODO: telemetry to error reporting service
        try{
            console.warn(message);
        }catch (e){
        }
    },

    error: function(messageOrError){
        var message;
        var error;
        if (messageOrError instanceof Error){
            error = messageOrError;
            message = error.toString();
        }else{
            message = messageOrError;
        }
        JSLog.remember(this.tag, 'error', message);
        // TODO: telemetry to error reporting service
        try{
            console.error(message);
        }catch (e){
        }
    }

};
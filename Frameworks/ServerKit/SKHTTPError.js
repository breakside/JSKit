'use strict';

JSGlobalObject.SKHTTPError = function(statusCode, message){
    if (this === undefined){
        return new SKHTTPError(statusCode, message);
    }
    if (statusCode instanceof SKHTTPError){
        this.statusCode = statusCode.statusCode;
        this.message = statusCode.message;
    }else{
        this.statusCode = statusCode;
        this.message = message;
    }
};
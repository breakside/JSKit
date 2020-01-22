// #import Foundation
// #import "SKHTTPResponse.js"
'use strict';

JSGlobalObject.SKHTTPAuthorization = function(authorized, authenticated, statusCode){
    if (this === undefined){
        return new SKHTTPAuthorization(authorized, authenticated, statusCode);
    }
    if (authenticated === undefined){
        authenticated = null;
    }
    this.authorized = authorized;
    this.authenticated = authenticated;
    if (statusCode !== undefined){
        this.statusCode = statusCode;
    }else{
        if (!this.authorized){
            if (this.authenticated !== null){
                this.statusCode = SKHTTPResponse.StatusCode.forbidden;
            }else{
                this.statusCode = SKHTTPResponse.StatusCode.unauthorized;
            }
        }else{
            this.statusCode = SKHTTPResponse.StatusCode.unknown;
        }
    }
};
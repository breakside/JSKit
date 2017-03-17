// #import "Foundation/JSObject.js"
// #import "Foundation/JSMIMEHeaderMap.js"
/* global JSClass, JSObject, JSDynamicProperty, JSURLResponse, JSMIMEHeaderMap */
'use strict';

JSClass("JSURLResponse", JSObject, {

    _headerMap: null,

    statusCode: -1,
    statusClass: JSDynamicProperty(),
    statusText: null,

    init: function(){
        this._headerMap = JSMIMEHeaderMap();
    },

    getStatusClass: function(){
        return this.statusCode === JSURLResponse.StatusCode.Unknown ? JSURLResponse.StatusClass.Unknown : Math.floor(this.statusCode / 100);
    }

});

JSURLResponse.StatusCode = {
    Unknown: -1,
    NoResponse: 0,
    Continue: 100,
    SwitchingProtocols: 101,
    OK: 200,
    Created: 201,
    Accepted: 202,
    NonAuthorativeInformation: 203,
    NoContent: 204,
    ResetContent: 205,
    PartialContent: 206,
    MultipleChoices: 300,
    MovedPermanently: 301,
    Found: 302,
    SeeOther: 303,
    NotModified: 304,
    UseProxy: 305,
    TemporaryRedirect: 306,
    BadRequest: 400,
    Unauthorized: 401,
    PaymentRequired: 402,
    Forbidden: 403,
    NotFound: 404,
    MethodNotAllowed: 405,
    NotAcceptable: 406,
    ProxyAuthenticationRequired: 407,
    RequestTimeout: 408,
    Conflict: 409,
    Gone: 410,
    LengthRequired: 411,
    PreconditionFailed: 412,
    PayloadTooLarge: 413,
    URITooLong: 414,
    UnsupportedMediaType: 415,
    RangeNotSatisfiable: 416,
    ExpectationFailed: 417,
    UpgradeRequired: 426,
    InternalServerError: 500,
    NotImplemented: 501,
    BadGateway: 502,
    ServiceUnavailable: 503,
    GatewayTimeout: 504,
    HTTPVersionNotSupported: 505
};

JSURLResponse.StatusClass = {
    Unknown: -1,
    NoResponse: 0,
    Informational: 1,
    Success: 2,
    Redirect: 3,
    ClientError: 4,
    ServerError: 5
};
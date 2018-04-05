// #import "Foundation/JSObject.js"
// #import "Foundation/JSMIMEHeaderMap.js"
/* global JSClass, JSObject, JSDynamicProperty, JSURLResponse, JSMIMEHeaderMap */
'use strict';

JSClass("JSURLResponse", JSObject, {

    _headerMap: null,

    statusCode: -1,
    statusClass: JSDynamicProperty(),
    statusText: null,
    data: null,

    init: function(){
        this._headerMap = JSMIMEHeaderMap();
    },

    getStatusClass: function(){
        return this.statusCode === JSURLResponse.StatusCode.unknown ? JSURLResponse.StatusClass.unknown : Math.floor(this.statusCode / 100);
    }

});

JSURLResponse.StatusCode = {
    unknown: -1,
    noResponse: 0,
    continue: 100,
    switchingProtocols: 101,
    ok: 200,
    created: 201,
    accepted: 202,
    nonAuthorativeInformation: 203,
    noContent: 204,
    resetContent: 205,
    partialContent: 206,
    multipleChoices: 300,
    movedPermanently: 301,
    found: 302,
    seeOther: 303,
    notModified: 304,
    useProxy: 305,
    temporaryRedirect: 306,
    badRequest: 400,
    unauthorized: 401,
    paymentRequired: 402,
    forbidden: 403,
    notFound: 404,
    methodNotAllowed: 405,
    notAcceptable: 406,
    proxyAuthenticationRequired: 407,
    requestTimeout: 408,
    conflict: 409,
    gone: 410,
    lengthRequired: 411,
    preconditionFailed: 412,
    payloadTooLarge: 413,
    uriTooLong: 414,
    unsupportedMediaType: 415,
    rangeNotSatisfiable: 416,
    expectationFailed: 417,
    upgradeRequired: 426,
    internalServerError: 500,
    notImplemented: 501,
    nadGateway: 502,
    serviceUnavailable: 503,
    gatewayTimeout: 504,
    httpVersionNotSupported: 505
};

JSURLResponse.StatusClass = {
    unknown: -1,
    noResponse: 0,
    informational: 1,
    success: 2,
    redirect: 3,
    clientError: 4,
    serverError: 5
};
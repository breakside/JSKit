// #import "Foundation/JSObject.js"
// #import "Foundation/JSData.js"
// #import "Foundation/String+JS.js"
// #import "Foundation/JSFormFieldMap.js"
/* global JSClass, JSObject, JSURL, JSDynamicProperty, JSCopy, JSReadOnlyProperty, JSData, jslog_create, JSFormFieldMap */

// https://tools.ietf.org/html/rfc3986

'use strict';

(function(){

var logger = jslog_create("foundation.url");

/// Represents a URL and each of its components
///
/// The `JSURL` class can be used to both parse a URL into its component parts, or construct a URL
/// by setting/modifying various components.
JSClass("JSURL", JSObject, {

    scheme: JSDynamicProperty('_scheme', null),
    encodedUserInfo: JSDynamicProperty('_encodedUserInfo', null),
    host: JSDynamicProperty('_host', null),
    port: JSDynamicProperty('_port', null),
    path: JSDynamicProperty(),
    pathComponents: JSDynamicProperty('_pathComponents', null),
    lastPathComponent: JSReadOnlyProperty(),
    encodedQuery: JSDynamicProperty('_encodedQuery', null),
    encodedFragment: JSDynamicProperty('_encodedFragment', null),
    query: JSDynamicProperty('_query', null),
    fragment: JSDynamicProperty(),

    isAbsolute: JSReadOnlyProperty(),
    encodedString: JSReadOnlyProperty(),

    _hasAuthority: false,
    _pathHasTrailingSlash: false,

    initWithString: function(str){
        var data = str.utf8();
        return this.initWithData(data);
    },

    initWithBaseURL: function(baseURL, relativeURL){
        if (relativeURL.isAbsolute){
            if (relativeURL._scheme === null){
                this._scheme = baseURL._scheme;
            }else{
                this._scheme = relativeURL._scheme;
            }
            this._encodedUserInfo = relativeURL._encodedUserInfo;
            this._host = relativeURL._host;
            this._port = relativeURL._port;
            this._pathComponents = JSCopy(relativeURL._pathComponents);
            this._hasAuthority = relativeURL._hasAuthority;
            this._pathHasTrailingSlash = relativeURL._pathHasTrailingSlash;
        }else{
            this._scheme = baseURL._scheme;
            this._encodedUserInfo = baseURL._encodedUserInfo;
            this._host = baseURL._host;
            this._port = baseURL._port;
            this._pathComponents = JSCopy(baseURL._pathComponents);
            this._hasAuthority = baseURL._hasAuthority;
            this._pathHasTrailingSlash = baseURL._pathHasTrailingSlash;
            this.appendPathComponents(relativeURL._pathComponents);
        }
        this._encodedQuery = relativeURL._encodedQuery;
        this._query = JSFormFieldMap(relativeURL._query);
        this._encodedFragment = relativeURL._encodedFragment;
    },

    initWithURL: function(url){
        this._scheme = url._scheme;
        this._encodedUserInfo = url._encodedUserInfo;
        this._host = url._host;
        this._port = url._port;
        this._pathComponents = JSCopy(url._pathComponents);
        this._encodedQuery = url._encodedQuery;
        this._query = JSFormFieldMap(url._query);
        this._encodedFragment = url._encodedFragment;
        this._hasAuthority = url._hasAuthority;
        this._pathHasTrailingSlash = url._pathHasTrailingSlash;
    },

    initWithData: function(data){
        this._query = JSFormFieldMap();
        var parser = JSURLParser(this);
        try{
            parser.parse(data.bytes);
        }catch (e){
            if (e.name == JSURLParserError){
                logger.warn(e);
                return null;
            }
            throw e;
        }
    },

    setHost: function(host){
        this._host = host;
        if (host === null){
            this._port = null;
            this._hasAuthority = false;
        }else{
            this._hasAuthority = true;
        }
    },

    // setPort: function(port){
    //     if (this.host === null){
    //         throw new Error("JSURL cannot set port without a host");
    //     }
    //     this._port = port;
    // },

    getPath: function(){
        var path = "";
        var component;
        for (var i = 0, l = this._pathComponents.length; i < l; ++i){
            component = this._pathComponents[i];
            if (i > 0 && this._pathComponents[i - 1] != "/"){
                path += "/";
            }
            path += component;
        }
        if (this._pathHasTrailingSlash){
            path += "/";
        }
        return path;
    },

    getLastPathComponent: function(){
        if (this._pathComponents.length > 0){
            return this._pathComponents[this._pathComponents.length - 1];
        }
        return null;
    },

    setPath: function(path){
        if (path === null || path === undefined){
            path = "";
        }
        var components = path.split('/');
        this._pathComponents = [];
        var minComponentCount = 1;
        if ((this.isAbsolute && path !== "") || (path.startsWith("/"))){
            this._pathComponents.push("/");
            minComponentCount = 2;
        }
        this._appendExpandedPathComponents(components);
        this._pathHasTrailingSlash = this._pathComponents.length >= minComponentCount && components[components.length - 1] === "";
    },

    setPathComponents: function(components){
        this._pathComponents = [];
        if (this.isAbsolute || (components.length > 0 && components[0].startsWith("/"))){
            this._pathComponents.push("/");
        }
        var expandedComponents = expandComponents(components);
        this._appendExpandedPathComponents(expandedComponents);
        this._pathHasTrailingSlash = false;
    },

    appendPathComponents: function(components){
        if (this._pathComponents.length === 0 && components.length > 0 && components[0].startsWith("/")){
            this._pathComponents.push("/");
        }
        var expandedComponents = expandComponents(components);
        this._appendExpandedPathComponents(expandedComponents);
        this._pathHasTrailingSlash = false;
    },

    appendPathComponent: function(component){
        this.appendPathComponents([component]);
    },

    appendingPathComponents: function(components){
        var url = this.copy();
        url.appendPathComponents(components);
        return url;
    },

    appendingPathComponent: function(component){
        var url = this.copy();
        url.appendPathComponent(component);
        return url;
    },

    removeLastPathComponent: function(){
        if (this._pathComponents.length > 0){
            this._pathComponents.pop();
            this._pathHasTrailingSlash = false;
        }
    },

    removingLastPathComponent: function(){
        var url = this.copy();
        url.removeLastPathComponent();
        return url;
    },

    copy: function(){
        return JSURL.initWithURL(this);
    },

    _appendExpandedPathComponents: function(expandedComponents){
        var component;
        var i, l;
        if (this.scheme === null || this.scheme === 'http' || this.scheme === 'https' || this.scheme === 'file' || this.scheme === 'ftp' || this.scheme === 'io.breakside.jskit.file'){
            for (i = 0, l = expandedComponents.length; i < l; ++i){
                component = expandedComponents[i];
                if (component !== "" && component !== "."){
                    if (component === ".." && this._pathComponents.length > 0 && this._pathComponents[this._pathComponents.length - 1] !== ".."){
                        if (this._pathComponents[this._pathComponents.length - 1] !== "/"){
                            this._pathComponents.pop();
                        }
                    }else{
                        this._pathComponents.push(component);
                    }
                }
            }
        }else{
            for (i = 0, l = expandedComponents.length; i < l; ++i){
                component = expandedComponents[i];
                this._pathComponents.push(component);
            }
        }
    },

    getIsAbsolute: function(){
        return this._hasAuthority;
    },

    setEncodedQuery: function(encodedQuery){
        this._encodedQuery = encodedQuery;
        this._query = JSFormFieldMap();
        if (this._encodedQuery !== null){
            this._query.decode(this._encodedQuery, true);
        }
    },

    getQuery: function(){
        return JSFormFieldMap(this._query);
    },

    setQuery: function(query){
        if (query === null){
            this._query = JSFormFieldMap();
        }else{
            this._query = JSFormFieldMap(query);
        }
        this._encodedQuery = this._query.encode(QueryReserved, true);
    },

    getEncodedString: function(){
        var encodedString = "";
        if (this._scheme !== null){
            encodedString += this._scheme;
            encodedString += ":";
        }
        if (this._hasAuthority){
            encodedString += "//";
        }
        if (this._host !== null){
            if (this._encodedUserInfo !== null){
                encodedString += String.initWithData(this._encodedUserInfo, String.Encoding.utf8);
                encodedString += '@';
            }
            // TODO: encode (punycode)
            encodedString += this._host;
            if (this._port !== null){
                encodedString += ":%d".sprintf(this._port);
            }
        }
        encodedString += String.initWithData(this.path.utf8().dataByEncodingPercentEscapes(PathReserved), String.Encoding.utf8);
        if (this._encodedQuery !== null){
            encodedString += '?';
            encodedString += String.initWithData(this._encodedQuery, String.Encoding.utf8);
        }
        if (this._encodedFragment !== null){
            encodedString += '#';
            encodedString += String.initWithData(this._encodedFragment, String.Encoding.utf8);
        }
        return encodedString;
    },

    getFragment: function(){
        if (this._encodedFragment === null){
            return null;
        }
        return this._encodedFragment.bytes.arrayByDecodingPercentEscapes().stringByDecodingUTF8();
    },

    setFragment: function(fragment){
        if (fragment === null){
            this._encodedFragment = null;
        }else{
            this._encodedFragment = JSData.initWithBytes(fragment.utf8().bytes.arrayByEncodingPercentEscapes());
        }
    },

    toString: function(){
        return this.getEncodedString();
    },

    isEqualToURL: function(url){
        if (this._scheme !== url._scheme){
            return false;
        }
        if (this._encodedUserInfo !== null && url._encodedUserInfo !== null){
            var decodedInfoA = this._encodedUserInfo.dataByDecodingPercentEscapes().stringByDecodingUTF8();
            var decodedInfoB = url._encodedUserInfo.dataByDecodingPercentEscapes().stringByDecodingUTF8();
            if (decodedInfoA !== decodedInfoB){
                return false;
            }
        }else if (this._encodedUserInfo !== null || url._encodedUserInfo !== null){
            return false;
        }
        if (this._host !== url._host){
            return false;
        }
        if (this._port !== url._port){
            return false;
        }
        if (this._pathComponents.length != url._pathComponents.length){
            return false;
        }
        for (var i = 0, l = this._pathComponents.length; i < l; ++i){
            if (this._pathComponents[i] !== url._pathComponents[i]){
                return false;
            }
        }
        if (this._encodedQuery !== null && url._encodedQuery !== null){
            var decodedQueryA = this._encodedQuery.dataByDecodingPercentEscapes().stringByDecodingUTF8();
            var decodedQueryB = url._encodedQuery.dataByDecodingPercentEscapes().stringByDecodingUTF8();
            if (decodedQueryA !== decodedQueryB){
                return false;
            }
        }else if (this._encodedQuery !== null || url._encodedQuery !== null){
            return false;
        }
        if (this._encodedFragment !== null && url._encodedFragment !== null){
            if (this.fragment !== url.fragment){
                return false;
            }
        }else if (this._encodedFragment !== null || url._encodedFragment !== null){
            return false;
        }
        return true;
    }

});

var JSURLParser = function(url){
    if (this === undefined){
        return new JSURLParser(url);
    }else{
        this.url = url;
    }
};

JSURLParser.prototype = {

    url: null,
    bytes: null,
    offset: 0,

    parse: function(bytes){
        // URL data should basically be printable ASCII.  This check isn't perfectly in accordance
        // with any specification, but it's an easy sanity check to run that allows further parsing
        // to make assumptions about the data it sees, and shouldn't mess up any legitimate use case.
        for (var i = 0, l = bytes.length; i < l; ++i){
            if (bytes[i] < 0x20 || bytes[i] >= 0x80){
                var error = new Error("Invalid character (%#02x) found in URL at byte position: %d".sprintf(bytes[i], i));
                error.name = JSURLParserError;
                throw error;
            }
        }
        this.bytes = bytes;
        this.parseStart();
    },

    parseStart: function(){
        this.url.scheme = null;
        this.url.encodedUserInfo = null;
        this.url.host = null;
        this.url.port = null;
        this.url.pathComponents = [];
        this.url.encodedQuery = null;
        this.url.encodedFragment = null;

        // Empty is allowed
        if (this.bytes.length === 0){
            return;
        }
        // A single byte must be a path
        if (this.bytes.length === 1){
            this.url.path = String.fromCharCode(this.bytes[0]);
            return;
        }
        // If we start with //, then we must be a scheme-relative authority
        if (this.bytes[0] == 0x2F && this.bytes[1] == 0x2F){
            this.parseAuthority();
            return;
        }
        // If we start with a ?, then we've just got a query string
        if (this.bytes[0] == 0x3F){
            this.parseQuery();
            return;
        }
        // If we start with a #, then we've just got a fragment
        if (this.bytes[0] == 0x23){
            this.parseFragment();
            return;
        }
        // Otherwise, we have either an absolute URI with a scheme, or a relative URI with a path
        this.parseSchemeOrPath();
    },

    isAlpha: function(b){
        return (b >= 0x41 && b <= 0x5A) || (b >= 0x61 && b <= 0x7A);
    },

    isNumeric: function(b){
        return b >= 0x30 && b < 0x40;
    },

    parseSchemeOrPath: function(){
        var foundScheme = false;
        var length = this.bytes.length;
        var offset = this.offset;
        var b;
        while (offset < length){
            b = this.bytes[offset];
            if (b == 0x3A){
                // Found a :, so we've got a scheme
                break;
            }
            if (b == 0x2F){
                // Found a / before a :, so we must have a path
                break;
            }
            ++offset;
        }
        if (b == 0x3A){
            var schemeData = JSData.initWithBytes(this.bytes.subarray(this.offset, offset));
            this.url._scheme = String.initWithData(schemeData, String.Encoding.utf8);
            this.offset = offset + 1;
            this.parseAuthority();
        }else{
            this.parsePath();
        }
    },

    parseAuthority: function(){
        var length = this.bytes.length;
        var offset = this.offset;
        if (offset < length - 1 && this.bytes[offset] == 0x2F && this.bytes[offset + 1] == 0x2F){
            this.offset += 2;
            this.url._hasAuthority = true;
            this.parseHost();
        }else{
            this.parsePath();
        }
    },

    parseHost: function(){
        var length = this.bytes.length;
        var offset = this.offset;
        var b;
        while (offset < length){
            b = this.bytes[offset];
            if (b == 0x40){
                // Found a @ before a / ? or #, must mean we've got user info before the host
                this.url._encodedUserInfo = JSData.initWithBytes(this.bytes.subarray(this.offset, offset));
                this.offset = offset + 1;
                break;
            }else if (b == 0x2F || b == 0x3F || b == 0x23){
                // /, ?, or #...must be the end of the host, and didn't find user info
                break;
            }
            ++offset;
        }
        offset = this.offset;
        while (offset < length){
            b = this.bytes[offset];
            if (b == 0x3A || b == 0x2F || b == 0x3F || b == 0x23){
                // :, /, ?, or #...must be the end of the host
                break;
            }
            ++offset;
        }
        if (offset > this.offset){
            var hostData = JSData.initWithBytes(this.bytes.subarray(this.offset, offset));
            this.url._host = String.initWithData(hostData, String.Encoding.utf8);
            // TODO: decode (punycode)
        }
        this.offset = offset;
        if (b == 0x3A){
            this.offset++;
            this.parsePort();
        }else{
            this.parsePath();
        }
    },

    parsePort: function(){
        var length = this.bytes.length;
        var offset = this.offset;
        var b;
        while (offset < length){
            b = this.bytes[offset];
            if (b == 0x2F || b == 0x3F || b == 0x23){
                // /, ?, or #...must be the end of the port
                break;
            }
            ++offset;
        }
        if (offset > this.offset){
            var port = 0;
            var i = this.offset;
            while (i < offset){
                b = this.bytes[i];
                if (b >= 0x30 && b < 0x40){
                    port *= 10;
                    port += b - 0x30;
                }else{
                    port = 0;
                    break;
                }
                ++i;
            }
            if (port !== 0){
                this.url._port = port;
            }
        }
        this.offset = offset;
        this.parsePath();
    },

    parsePath: function(){
        var offset = this.offset;
        var length = this.bytes.length;
        var b;
        while (offset < length){
            b = this.bytes[offset];
            if (b == 0x23 || b == 0x3F){
                break;
            }
            ++offset;
        }
        var pathData = this.bytes.subarray(this.offset, offset);
        this.url.path = pathData.arrayByDecodingPercentEscapes().stringByDecodingUTF8();
        this.offset = offset;
        if (b == 0x3f){
            this.parseQuery();
        }else if (b == 0x23){
            this.parseFragment();
        }
    },

    parseQuery: function(){
        var offset = this.offset;
        var length = this.bytes.length;
        if (offset < length){
            var b = this.bytes[offset];
            if (b == 0x3F){
                ++offset;
                this.offset = offset;
                while (offset < length){
                    b = this.bytes[offset];
                    if (b == 0x23){
                        break;
                    }
                    ++offset;
                }
                this.url.encodedQuery = JSData.initWithBytes(this.bytes.subarray(this.offset, offset));
            }
            this.offset = offset;
            if (b == 0x23){
                this.parseFragment();
            }
        }
    },

    parseFragment: function(){
        var offset = this.offset;
        var length = this.bytes.length;
        if (offset < length){
            var b = this.bytes[offset];
            if (b == 0x23){
                this.offset += 1;
                offset = this.bytes.length;
                this.url._encodedFragment = JSData.initWithBytes(this.bytes.subarray(this.offset, offset));
            }
        }
    }

};

var PathReserved = {
    0x22: true,
    0x23: true,
    0x3c: true,
    0x3e: true,
    0x3f: true,
    0x5b: true,
    0x5c: true,
    0x5d: true,
    0x5e: true,
    0x60: true,
    0x7b: true,
    0x7c: true,
    0x7d: true
};

var QueryReserved = {
    0x22: true,
    0x23: true,
    0x3c: true,
    0x3e: true,
    0x5b: true,
    0x5c: true,
    0x5d: true,
    0x5e: true,
    0x60: true,
    0x7b: true,
    0x7c: true,
    0x7d: true
};

var JSURLParserError = "JSURLParserError";

function expandComponents(components){
    return components.join("/").split("/");
}

})();
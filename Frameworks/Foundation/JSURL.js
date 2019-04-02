// #import "Foundation/JSObject.js"
// #import "Foundation/JSData.js"
// #import "Foundation/String+JS.js"
// #import "Foundation/JSFormFieldMap.js"
// #import "Foundation/JSLog.js"
/* global JSClass, JSObject, JSRange, JSURL, JSDynamicProperty, JSCopy, JSReadOnlyProperty, JSData, JSLog, JSFormFieldMap */

// https://tools.ietf.org/html/rfc3986

'use strict';

(function(){

var logger = JSLog("foundation", "url");

/// Represents a URL and each of its components
///
/// The `JSURL` class can be used to both parse a URL into its component parts, or construct a URL
/// by setting/modifying various components.
JSClass("JSURL", JSObject, {

    scheme: JSDynamicProperty('_scheme', null),
    encodedUserInfo: JSDynamicProperty('_encodedUserInfo', null),
    host: JSDynamicProperty('_host', null),
    port: JSDynamicProperty('_port', null),
    path: JSDynamicProperty('_path', null),
    pathComponents: JSDynamicProperty(),
    lastPathComponent: JSReadOnlyProperty(),
    hasDirectoryPath: JSDynamicProperty('_hasDirectoryPath', false),
    fileExtension: JSReadOnlyProperty(),
    encodedQuery: JSDynamicProperty('_encodedQuery', null),
    encodedFragment: JSDynamicProperty('_encodedFragment', null),
    query: JSDynamicProperty(),
    fragment: JSDynamicProperty(),

    isAbsolute: JSReadOnlyProperty(),
    encodedString: JSReadOnlyProperty(),

    _hasAuthority: false,

    initWithString: function(str, baseURL){
        var data = str.utf8();
        var url = this.initWithData(data);
        if (url === null){
            return null;
        }
        if (baseURL){
            this.resolveToBaseURL(baseURL);
        }
    },

    initWithURL: function(url){
        this._scheme = url._scheme;
        this._encodedUserInfo = url._encodedUserInfo;
        this._host = url._host;
        this._port = url._port;
        this._path = url._path;
        this._encodedQuery = url._encodedQuery;
        this._encodedFragment = url._encodedFragment;
        this._hasAuthority = url._hasAuthority;
        this._hasDirectoryPath = url._hasDirectoryPath;
    },

    initWithData: function(data){
        var parser = JSURLParser(this);
        try{
            parser.parse(data);
        }catch (e){
            if (e.name == JSURLParserError){
                logger.warn(e);
                return null;
            }
            throw e;
        }
    },

    resolveToBaseURL: function(baseURL){
        if (this._hasAuthority){
            if (this._scheme === null){
                this._scheme = baseURL._scheme;
            }
        }else{
            this._scheme = baseURL._scheme;
            this._hasAuthority = baseURL._hasAuthority;
            this._encodedUserInfo = baseURL._encodedUserInfo;
            this._host = baseURL._host;
            this._port = baseURL._port;
            if (this._path === null || this._path === ""){
                this._path = baseURL._path;
                if (this._encodedQuery === null){
                    this._encodedQuery = baseURL._encodedQuery;
                    if (this._encodedFragment === null){
                        this._encodedFragment = baseURL._encodedFragment;
                    }
                }
                this._hasDirectoryPath = baseURL._hasDirectoryPath;
            }else if (baseURL.path !== null && !this._path.startsWith("/")){
                var mergedComponents = JSCopy(baseURL.pathComponents);
                var components = this.pathComponents;
                var component;
                if (!baseURL._hasDirectoryPath && mergedComponents.length > 0){
                    mergedComponents.pop();
                }
                for (var i = 0, l = components.length; i < l; ++i){
                    component = components[i];
                    mergedComponents.push(component);
                }
                var hasDirectoryPath = this._hasDirectoryPath;
                this.setPathComponents(mergedComponents, this._hasDirectoryPath);
                this._hasDirectoryPath = hasDirectoryPath;
                this.standardize();
            }
        }
    },

    resolvingToBaseURL: function(baseURL){
        var url = this.copy();
        url.resolveToBaseURL(baseURL);
        return url;
    },

    setHost: function(host){
        this._host = host;
        if (host === null){
            this._port = null;
            this._hasAuthority = false;
        }else{
            this._hasAuthority = true;
            // If we have a relative path and are setting a host, the
            // path must become absolute
            if (this._path !== null && this._path !== '' && !this._path.startsWith("/")){
                this.path = "/" + this._path;
            }
        }
    },

    // setPort: function(port){
    //     if (this.host === null){
    //         throw new Error("JSURL cannot set port without a host");
    //     }
    //     this._port = port;
    // },

    setPath: function(path){
        // If we have an authority, the path must be absolute
        if (this._hasAuthority && path !== null && path !== '' && !path.startsWith("/")){
            path = "/" + path;
        }
        this._path = path;
        this._pathComponents = null;
        this._hasDirectoryPath = path !== null && path.endsWith("/");
    },

    _updatePathFromComponents: function(){
        var path = pathFromComponents(this._pathComponents);
        if (path !== null){
            if (this._hasDirectoryPath && !path.endsWith("/")){
                path += "/";
            }
        }
        this._path = path;
    },

    _pathComponents: null,

    getLastPathComponent: function(){
        var components = this.pathComponents;
        if (components.length > 0){
            return components[components.length - 1];
        }
        return null;
    },

    getFileExtension: function(){
        var components = this.pathComponents;
        if (components.length > 0){
            return components[components.length - 1].fileExtension;
        }
        return '';
    },

    getPathComponents: function(){
        if (this._pathComponents === null){
            this._pathComponents = componentsFromPath(this._path);
        }
        return this._pathComponents;
    },

    setPathComponents: function(components, isFinalDirectory){
        this._pathComponents = [];
        this.appendPathComponents(components, isFinalDirectory);
    },

    appendPathComponents: function(components, isFinalDirectory){
        if (this._pathComponents === null){
            this._pathComponents = componentsFromPath(this._path);
        }
        if (components.length > 0 && components[0].startsWith("/") && this._pathComponents.length === 0){
            this._pathComponents.push("/");
        }
        components = components.join("/").split("/");
        var component;
        for (var i = 0, l = components.length; i < l; ++i){
            component = components[i];
            if (component !== ""){
                this._pathComponents.push(component);
            }
        }
        if (this._hasAuthority && this._pathComponents.length > 0 && this._pathComponents[0] != "/"){
            this._pathComponents.unshift("/");
        }
        this._hasDirectoryPath = isFinalDirectory === true;
        this._updatePathFromComponents();
    },

    appendPathComponent: function(component, isDirectory){
        this.appendPathComponents([component], isDirectory);
    },

    appendingPathComponents: function(components, isFinalDirectory){
        var url = this.copy();
        url.appendPathComponents(components);
        return url;
    },

    appendingPathComponent: function(component, isDirectory){
        var url = this.copy();
        url.appendPathComponent(component, isDirectory);
        return url;
    },

    removeLastPathComponent: function(){
        if (this.pathComponents.length > 0){
            this._pathComponents.pop();
            this._hasDirectoryPath = this._pathComponents.length > 0;
            this._updatePathFromComponents();
        }
    },

    removingLastPathComponent: function(){
        var url = this.copy();
        url.removeLastPathComponent();
        return url;
    },

    setHasDirectoryPath: function(hasDirectoryPath){
        this._hasDirectoryPath = hasDirectoryPath;
    },

    standardize: function(){
        var components = JSCopy(this.pathComponents);
        if (components.length === 0){
            return;
        }
        var standardComponents = [];
        var component;
        for (var i = 0, l = components.length; i < l; ++i){
            component = components[i];
            if (component == "."){
            }else if (component == ".." && standardComponents.length > 0 && standardComponents[standardComponents.length - 1] != ".."){
                if (standardComponents[standardComponents.length - 1] != "/"){
                    standardComponents.pop();
                }
            }else{
                standardComponents.push(component);
            }
        }
        this.setPathComponents(standardComponents, this._hasDirectoryPath);
    },

    standardized: function(){
        var url = this.copy();
        url.standardize();
        return url;
    },

    copy: function(){
        return JSURL.initWithURL(this);
    },

    getIsAbsolute: function(){
        return this._hasAuthority;
    },

    setEncodedQuery: function(encodedQuery){
        this._encodedQuery = encodedQuery;
        this._query = null;
    },

    getQuery: function(){
        if (this._query === null){
            this._query = JSFormFieldMap();
            if (this._encodedQuery !== null){
                this._query.decode(this._encodedQuery, true);
            }
        }
        return this._query;
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
            encodedString += JSURL.encodeDomainName(this._host);
            if (this._port !== null){
                encodedString += ":%d".sprintf(this._port);
            }
        }
        if (this._path !== null){
            encodedString += String.initWithData(this._path.utf8().dataByEncodingPercentEscapes(PathReserved), String.Encoding.utf8);
        }
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
        return this._encodedFragment.dataByDecodingPercentEscapes().stringByDecodingUTF8();
    },

    setFragment: function(fragment){
        if (fragment === null){
            this._encodedFragment = null;
        }else{
            this._encodedFragment = fragment.utf8().dataByEncodingPercentEscapes();
        }
    },

    toString: function(){
        return this.getEncodedString();
    },

    isEqual: function(url){
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
        if (this._path !== url._path){
            return false;
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
    },

    relativeTo: function(baseURL){
        if (this._scheme != baseURL._scheme){
            return this;
        }
        var url = this.copy();
        url.scheme = null;
        if (url._encodedUserInfo == baseURL._encodedUserInfo && url._host == baseURL._host && url._port == baseURL._port){
            url.encodedUserInfo = null;
            url.host = null;
            var components = url.pathComponents;
            var baseComponents = baseURL.pathComponents;
            if (!baseURL._hasDirectoryPath){
                baseComponents = baseComponents.slice(0, baseComponents.length - 1);
            }
            for (var i = 0; i < components.length && i < baseComponents.length && components[i] == baseComponents[i]; ++i){
            }
            components = components.slice(i);
            for (; i < baseComponents.length; ++i){
                components.unshift('..');
            }
            url.setPathComponents(components, url._hasDirectoryPath);
        }
        return url;
    }

});

JSURL.encodeDomainName = function(host){
    // TODO: implement punycode encoding
    return host;
};

JSURL.decodeDomainName = function(encodedHost){
    // TODO: implement punycode decoding
    return encodedHost;
};

var JSURLParser = function(url){
    if (this === undefined){
        return new JSURLParser(url);
    }else{
        this.url = url;
    }
};

JSURLParser.prototype = {

    url: null,
    data: null,
    offset: 0,

    parse: function(data){
        // URL data should basically be printable ASCII.  This check isn't perfectly in accordance
        // with any specification, but it's an easy sanity check to run that allows further parsing
        // to make assumptions about the data it sees, and shouldn't mess up any legitimate use case.
        for (var i = 0, l = data.length; i < l; ++i){
            if (data[i] < 0x20 || data[i] >= 0x80){
                var error = new Error("Invalid character (%#02x) found in URL at byte position: %d".sprintf(data[i], i));
                error.name = JSURLParserError;
                throw error;
            }
        }
        this.data = data;
        this.parseStart();
    },

    parseStart: function(){
        this.url.scheme = null;
        this.url.encodedUserInfo = null;
        this.url.host = null;
        this.url.port = null;
        this.url.path = null;
        this.url.encodedQuery = null;
        this.url.encodedFragment = null;

        // Empty is allowed
        if (this.data.length === 0){
            return;
        }
        // A single byte must be a path
        if (this.data.length === 1){
            this.url.path = String.fromCharCode(this.data[0]);
            return;
        }
        // If we start with //, then we must be a scheme-relative authority
        if (this.data[0] == 0x2F && this.data[1] == 0x2F){
            this.parseAuthority();
            return;
        }
        // If we start with a ?, then we've just got a query string
        if (this.data[0] == 0x3F){
            this.parseQuery();
            return;
        }
        // If we start with a #, then we've just got a fragment
        if (this.data[0] == 0x23){
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
        var length = this.data.length;
        var offset = this.offset;
        var b;
        while (offset < length){
            b = this.data[offset];
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
            var schemeData = this.data.subdataInRange(JSRange(this.offset, offset - this.offset));
            this.url._scheme = String.initWithData(schemeData, String.Encoding.utf8);
            this.offset = offset + 1;
            this.parseAuthority();
        }else{
            this.parsePath();
        }
    },

    parseAuthority: function(){
        var length = this.data.length;
        var offset = this.offset;
        if (offset < length - 1 && this.data[offset] == 0x2F && this.data[offset + 1] == 0x2F){
            this.offset += 2;
            this.url._hasAuthority = true;
            this.parseHost();
        }else{
            this.parsePath();
        }
    },

    parseHost: function(){
        var length = this.data.length;
        var offset = this.offset;
        var b;
        while (offset < length){
            b = this.data[offset];
            if (b == 0x40){
                // Found a @ before a / ? or #, must mean we've got user info before the host
                this.url._encodedUserInfo = this.data.subdataInRange(JSRange(this.offset, offset - this.offset));
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
            b = this.data[offset];
            if (b == 0x3A || b == 0x2F || b == 0x3F || b == 0x23){
                // :, /, ?, or #...must be the end of the host
                break;
            }
            ++offset;
        }
        if (offset > this.offset){
            var hostData = this.data.subdataInRange(JSRange(this.offset, offset - this.offset));
            var encodedHost = String.initWithData(hostData, String.Encoding.utf8);
            this.url._host = JSURL.decodeDomainName(encodedHost);
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
        var length = this.data.length;
        var offset = this.offset;
        var b;
        while (offset < length){
            b = this.data[offset];
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
                b = this.data[i];
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
        var length = this.data.length;
        var b;
        while (offset < length){
            b = this.data[offset];
            if (b == 0x23 || b == 0x3F){
                break;
            }
            ++offset;
        }
        var pathData = this.data.subarray(this.offset, offset);
        this.url.path = pathData.dataByDecodingPercentEscapes().stringByDecodingUTF8();
        this.offset = offset;
        if (b == 0x3f){
            this.parseQuery();
        }else if (b == 0x23){
            this.parseFragment();
        }
    },

    parseQuery: function(){
        var offset = this.offset;
        var length = this.data.length;
        if (offset < length){
            var b = this.data[offset];
            if (b == 0x3F){
                ++offset;
                this.offset = offset;
                while (offset < length){
                    b = this.data[offset];
                    if (b == 0x23){
                        break;
                    }
                    ++offset;
                }
                this.url.encodedQuery = this.data.subdataInRange(JSRange(this.offset, offset - this.offset));
            }
            this.offset = offset;
            if (b == 0x23){
                this.parseFragment();
            }
        }
    },

    parseFragment: function(){
        var offset = this.offset;
        var length = this.data.length;
        if (offset < length){
            var b = this.data[offset];
            if (b == 0x23){
                this.offset += 1;
                offset = this.data.length;
                this.url._encodedFragment = this.data.subdataInRange(JSRange(this.offset, offset - this.offset));
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

function pathFromComponents(components){
    if (components.length === 0){
        return null;
    }
    var path = "";
    if (components[0] == "/"){
        return "/" + components.slice(1).join("/");
    }
    return components.join("/");
}

function componentsFromPath(path){
    if (path === null || path.length === 0){
        return [];
    }
    var result = [];
    if (path.startsWith("/")){
        result.push("/");
        path = path.substr(1);
    }
    var components = path.split('/');
    var component;
    for (var i = 0, l = components.length; i < l; ++i){
        component = components[i];
        if (component !== ""){
            result.push(component);
        }
    }
    return result;
}

})();
// #import "Foundation/JSObject.js"
// #import "Foundation/JSFontDescriptor.js"
/* global JSClass, JSObject, JSBundle, JSReadOnlyProperty, JSFont, JSFontDescriptor */
'use strict';

JSClass("JSFont", JSObject, {

    descriptor: JSReadOnlyProperty('_descriptor', null),
    fullName: JSReadOnlyProperty('_fullName', null),
    postScriptName: JSReadOnlyProperty('_postScriptName', null),
    familyName: JSReadOnlyProperty(),
    faceName: JSReadOnlyProperty('_faceName', null),
    pointSize: JSReadOnlyProperty('_pointSize', 0.0),
    ascender: JSReadOnlyProperty('_ascender', 0.0),
    descender: JSReadOnlyProperty('_descender', 0.0),
    lineHeight: JSReadOnlyProperty('_lineHeight', 0.0),
    leading: JSReadOnlyProperty('_leading', 0.0),
    _ascenderInEMs: 0.0,
    _descenderInEms: 0.0,

    getFamilyName: function(){
        return this._descriptor.family;
    },

    fontWithWeight: function(weight){
        var descriptor = this.descriptor.descriptorWithWeight(weight);
        return JSFont.fontWithDescriptor(descriptor, this.pointSize);
    },

    fontWithStyle: function(style){
        var descriptor = this.descriptor.descriptorWithStyle(style);
        return JSFont.fontWithDescriptor(descriptor, this.pointSize);
    },

    fontWithPointSize: function(pointSize){
        var descriptor = this.descriptor;
        return JSFont.fontWithDescriptor(descriptor, pointSize);
    },

    _calculateMetrics: function(){
        this._ascender = this._ascenderInEMs * this.pointSize;
        this._descender = this._descenderInEms * this.pointSize;
        this._lineHeight = this._ascender - this._descender;
        this._leading = 0.0;
    }

});

JSFont._fontWithResourceInfo = function(info, pointSize){
    var id = info.unique_identifier;
    var font = JSFont._cache[id];
    if (!font){
        font = JSFont.init();
        font._descriptor = JSFontDescriptor.initWithProperties(info.family, info.weight, info.style);
        font._fullName = info.name;
        font._postScriptName = info.postscript_name;
        font._faceName = info.face;
        font._ascenderInEMs = info.ascender;
        font._descenderInEms = info.descender;
        font._pointSize = pointSize;
        font._calculateMetrics();
    }
    return font;
};

JSFont.fontWithResourceName = function(resourceName, pointSize){
    var resource = JSBundle.mainBundle.resourceNamed(resourceName);
    return JSFont._fontWithResourceInfo(resource.font, pointSize);
};

JSFont.fontWithFamily = function(family, pointSize, weight, style){
    var descriptor = JSFontDescriptor.initWithProperties(family, weight || JSFont.Weight.Regular, style || JSFont.Style.Normal);
    return JSFont.fontWithDescriptor(descriptor, pointSize);
};

JSFont.fontWithDescriptor = function(descriptor, pointSize){
    var fonts = JSFont._families[descriptor.family] || [];
    var info;
    for (var i = 0, l = fonts.length; i < l; ++i){
        info = fonts[i];
        if (info.weight == descriptor.weight && info.style == descriptor.style){
            return JSFont._fontWithResourceInfo(info, pointSize);
        }
    }
    return null;
};

JSFont.registerBundleFonts = function(bundle){
    var resource;
    for (var i = 0, l = bundle.fonts.length; i < l; ++i){
        resource = bundle.resourceNamed(bundle.fonts[i], 'font');
        JSFont.registerFontResource(resource);
    }
};

JSFont.registerFontResource = function(resource){
    var info = resource.font;
    if (!(info.family in JSFont._families)){
        JSFont._families[info.family] = [];
    }
    JSFont._families[info.family].push(info);
};

JSFont.Weight = {
    UltraLight: 100,
    Thin: 200,
    Light: 300,
    Regular: 400,
    Medium: 500,
    Semibold: 600,
    Bold: 700,
    Heavy: 800,
    Black: 900
};

JSFont.Style = {
    Normal: "normal",
    Italic: "italic"
};

JSFont._cache = {
};

JSFont._families = {
};
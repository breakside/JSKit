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
    _unitsPerEM: 0,
    _ascenderInUnits: 0,
    _descenderInUnits: 0,

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
        this._ascender = this._ascenderInUnits / this._unitsPerEM * this.pointSize;
        this._descender = this._descenderInUnits / this._unitsPerEM * this.pointSize;
        this._lineHeight = this._ascender - this._descender;
        this._leading = 0.0;
    },

    _glyphIndexForCharacter: function(character){
        var cmap;
        var min = 0;
        var max = cmap.length;
        var mid;
        while (min < max){
            mid = min + Math.floor((max - min) / 2);
            if (character.code < cmap[mid][0]){
                max = mid;
            }else if (character.code > cmap[mid][1]){
                min = mid + 1;
            }else{
                return cmap[mid][2] + (character.code - cmap[mid][0]);
            }
        }
        return -1;

    },

    containsGlyphForCharacter: function(character){
        return this._glyphIndexForCharacter(character) >= 0;
    },

    widthOfCharacter: function(character){
        var widths;
        var glyphIndex = this._glyphIndexForCharacter(character);
        if (glyphIndex >= 0){
            if (glyphIndex >= widths.length){
                return widths[widths.length - 1];
            }
            return widths[glyphIndex];
        }
        return 0; // FIXME: should be width of unkonwn character
    }

});

JSFont._creationHooks = [];

JSFont.addCreationHook = function(method){
    JSFont._creationHooks.push(method);
};

JSFont._fontWithResourceInfo = function(info, pointSize){
    var id = info.unique_identifier;
    var font = JSFont._cache[id];
    if (!font){
        font = JSFont.init();
        font._descriptor = JSFontDescriptor.initWithProperties(info.family, info.weight, info.style);
        font._fullName = info.name;
        font._postScriptName = info.postscript_name;
        font._faceName = info.face;
        font._unitsPerEM = info.unitsPerEM;
        font._ascenderInUnits = info.ascender;
        font._descenderInUnits = info.descender;
        font._pointSize = pointSize;
        font._calculateMetrics();
        for (var i = 0, l = JSFont._creationHooks.length; i < l; ++i){
            JSFont._creationHooks[i].call(font);
        }
        JSFont._cache[id] = font;
    }
    return font;
};

JSFont.fontWithResourceName = function(resourceName, pointSize){
    var resource = JSBundle.mainBundle.resourceNamed(resourceName);
    return JSFont._fontWithResourceInfo(resource.font, pointSize);
};

JSFont.fontWithFamily = function(family, pointSize, weight, style){
    var descriptor = JSFontDescriptor.initWithProperties(family, weight || JSFont.Weight.regular, style || JSFont.Style.normal);
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
    ultraLight: 100,
    thin: 200,
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    heavy: 800,
    black: 900
};

JSFont.Style = {
    normal: "normal",
    italic: "italic"
};

JSFont._cache = {
};

JSFont._families = {
};
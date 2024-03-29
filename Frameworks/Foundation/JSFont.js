// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #import "JSObject.js"
// #import "JSFontDescriptor.js"
// #import "CoreTypes.js"
// #import "JSBundle.js"
'use strict';

(function(){

JSClass("JSFont", JSObject, {

    descriptor: JSReadOnlyProperty('_descriptor', null),
    fullName: JSReadOnlyProperty(),
    postScriptName: JSReadOnlyProperty(),
    familyName: JSReadOnlyProperty(),
    faceName: JSReadOnlyProperty(),
    pointSize: JSReadOnlyProperty('_pointSize', 0.0),
    ascender: JSReadOnlyProperty('_ascender', 0.0),
    descender: JSReadOnlyProperty('_descender', 0.0),
    lineHeight: JSReadOnlyProperty('_lineHeight', 0.0),
    displayLineHeight: JSReadOnlyProperty('_displayLineHeight', 0),
    displayAscender: JSReadOnlyProperty('_displayAscender', 0),
    displayDescender: JSReadOnlyProperty('_displayDescender', 0),
    leading: JSReadOnlyProperty('_leading', 0.0),

    initWithDescriptor: function(descriptor, pointSize){
        this._descriptor = descriptor;
        this._pointSize = pointSize;
        this._calculateMetrics();
    },

    initWithSpec: function(spec){
        JSFont.$super.initWithSpec.call(this, spec);
        var family;
        var weight;
        var style;
        var size;
        var defaults = JSFontDescriptor.system;
        // if ('descriptor' in values){
        //     values = values.descriptor;
        // }
        if (spec.containsKey('family')){
            family = spec.valueForKey("family");
        }else if (defaults){
            family = defaults.family;
        }
        if (spec.containsKey('weight')){
            weight = spec.valueForKey("weight", JSFont.Weight);
        }else if (defaults){
            weight = defaults.weight;
        }else{
            weight = JSFont.Weight.regular;
        }
        if (spec.containsKey('style')){
            style = spec.valueForKey("style", JSFont.Style);
        }else if (defaults){
            style = defaults.style;
        }else{
            style = JSFont.Style.normal;
        }
        if (spec.containsKey('size')){
            size = spec.valueForKey("size", JSFont.Size);
        }else{
            size = JSFont.Size.normal;
        }
        if (family){
            var descriptor = JSFontDescriptor.descriptorWithFamily(family, weight, style);
            if (descriptor !== null){
                return JSFont.initWithDescriptor(descriptor, size);
            }
        }
        return null;
    },

    initFromDictionary: function(dictionary){
        var descriptor = JSFontDescriptor.descriptorWithFamily(dictionary.family, dictionary.weight, dictionary.style);
        if (descriptor === null){
            if (dictionary.url){
                descriptor = JSURLFontDescriptor.initWithURL(JSURL.initWithString(dictionary.url), dictionary.family, dictionary.weight, dictionary.style);
                JSFontDescriptor.registerDescriptor(descriptor);
            }
        }
        if (descriptor !== null){
            return JSFont.initWithDescriptor(descriptor, dictionary.size);
        }
        return null;
    },

    dictionaryRepresentation: function(){
        return {
            url: this.descriptor instanceof JSURLFontDescriptor ? this._descriptor.url : undefined,
            family: this._descriptor.family,
            weight: this._descriptor.weight,
            style: this._descriptor.style,
            size: this.pointSize
        };
    },

    getFullName: function(){
        return this._descriptor.name;
    },

    getPostScriptName: function(){
        return this._descriptor.postScriptName;
    },

    getFamilyName: function(){
        return this._descriptor.family;
    },

    getFaceName: function(){
        return this._descriptor.face;
    },

    fontWithWeight: function(weight){
        if (weight == this.descriptor.weight){
            return this;
        }
        var descriptor = this.descriptor.descriptorWithWeight(weight);
        return JSFont.initWithDescriptor(descriptor, this.pointSize);
    },

    bolderFont: function(){
        var descriptor = this.descriptor.bolderDescriptor();
        if (descriptor === null){
            descriptor = this.descriptor.fontWithWeight(JSFont.Weight.bold);
        }
        return JSFont.initWithDescriptor(descriptor, this.pointSize);
    },

    fontWithStyle: function(style){
        if (style == this.descriptor.style){
            return this;
        }
        var descriptor = this.descriptor.descriptorWithStyle(style);
        return JSFont.initWithDescriptor(descriptor, this.pointSize);
    },

    fontWithPointSize: function(pointSize){
        if (pointSize == this.descriptor.pointSize){
            return this;
        }
        var descriptor = this.descriptor;
        return JSFont.initWithDescriptor(descriptor, pointSize);
    },

    _calculateMetrics: function(){
        this._ascender = this._descriptor._ascender / this._descriptor._unitsPerEM * this.pointSize;
        this._descender = this._descriptor._descender / this._descriptor._unitsPerEM * this.pointSize;
        this._lineHeight = this._ascender - this._descender;
        this._leading = 0.0;
        this._calculateDisplayMetrics();
    },

    _calculateDisplayMetrics: function(){
        this._displayAscender = Math.round(this._ascender);
        this._displayDescender = Math.round(this._descender);
        this._displayLineHeight = this._displayAscender - this._displayDescender;
    },

    glyphsForString: function(str){
        var iterator = str.unicodeIterator();
        var glyphs = [];
        while (iterator.index < str.length){
            glyphs.push(this.glyphForCharacter(iterator.character));
            iterator.increment();
        }
        return glyphs;
    },

    glyphForCharacter: function(character){
        return this._descriptor.glyphForCharacter(character);
    },

    characterForGlyph: function(glyph){
        return this._descriptor.characterForGlyph(glyph);
    },

    charactersForGlyphs: function(glyphs){
        return this._descriptor.charactersForGlyphs(glyphs);
    },

    stringForGlyphs: function(glyphs){
        return this._descriptor.stringForGlyphs(glyphs);
    },

    widthOfGlyph: function(glyphIndex){
        return this._descriptor.widthOfGlyph(glyphIndex) * this.pointSize;
    },

    widthOfCharacter: function(character){
        return this._descriptor.widthOfCharacter(character) * this.pointSize;
    },

    widthOfString: function(str){
        var iterator = str.unicodeIterator();
        var width = 0;
        while (iterator.index < str.length){
            width += this.widthOfCharacter(iterator.character);
            iterator.increment();
        }
        return width;
    }

});

JSFont.fontWithFamily = function(family, pointSize, weight, style){
    var descriptor = JSFontDescriptor.descriptorWithFamily(family, weight || JSFont.Weight.regular, style || JSFont.Style.normal);
    return JSFont.initWithDescriptor(descriptor, pointSize);
};

JSFont.registerBundleFonts = function(bundle){
    var metadata = bundle.fonts();
    var descriptors = [];
    var font;
    for (var i = 0, l = metadata.length; i < l; ++i){
        font = JSFont._registerFontResource(bundle, metadata[i]);
        descriptors.push(font);
    }
    return descriptors;
};

JSFont._registerFontResource = function(bundle, metadata){
    var descriptor = JSResourceFontDescriptor.initWithMetadata(bundle, metadata);
    JSFontDescriptor.registerDescriptor(descriptor);
    return descriptor;
};

JSFont.registerSystemFontResource = function(name, bundle){
    bundle = bundle || JSBundle.mainBundle;
    var ext;
    var extIndex = name.lastIndexOf('.');
    var i, l;
    var extGuessed = false;
    if (extIndex > 0 && extIndex < name.length - 1){
        ext = name.substr(extIndex + 1);
        name = name.substr(0, extIndex);
    }else{
        extGuessed = true;
        ext = "ttf";
    }
    var metadata = bundle.metadataForResourceName(name, ext);
    if (extGuessed && metadata === null){
        ext = "otf";
        metadata = bundle.metadataForResourceName(name, ext);
    }
    JSFontDescriptor.system = JSResourceFontDescriptor.descriptorsByName[metadata.font.unique_identifier];
};

JSFont.registerSystemFont = function(familyName, weight, style){
    JSFontDescriptor.system = JSFontDescriptor.descriptorWithFamily(familyName, weight || JSFont.Weight.regular, style || JSFont.Style.normal);
};

JSFont.registerSystemFontDescriptor = function(descriptor){
    JSFontDescriptor.system = descriptor;
};

JSFont.unregisterAllFonts = function(){
    JSFontDescriptor.descriptorsByFamily = {};
    JSResourceFontDescriptor.descriptorsByName = {};
    JSFontDescriptor.system = null;
};

JSFont.systemFontOfSize = function(pointSize){
    if (JSFontDescriptor.system === null){
        return null;
    }
    return JSFont.initWithDescriptor(JSFontDescriptor.system, pointSize);
};

JSFont.Size = {
    detail: 12.0,
    normal: 14.0,
    heading: 24.0
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

})();
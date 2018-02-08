// #import "Foundation/JSObject.js"
/* global JSClass, JSObject, JSReadOnlyProperty, JSFontDescriptor */
'use strict';

JSClass("JSFontDescriptor", JSObject, {

    family: JSReadOnlyProperty('_family', null),
    // These next two properties have defaults that really should come from JSFont
    // enums, but that would create a circular import loop, so we'll just make an exception
    // and hard code static values
    weight: JSReadOnlyProperty('_weight', 400),
    style: JSReadOnlyProperty('_style', "normal"),

    initWithSpec: function(spec, values){
        this._family = values.family;
        if (values.weight){
            this._weight = spec.resolvedValue(values.weight);
        }
        if (values.style){
            this._style = spec.resolvedValue(values.style);
        }
    },

    initWithFamily: function(family){
        this._family = family;
    },

    initWithProperties: function(family, weight, style){
        this._family = family;
        this._weight = weight;
        this._style = style;
    },

    descriptorWithWeight: function(weight){
        return JSFontDescriptor.initWithProperties(this._family, weight, this._style);
    },

    descriptorWithStyle: function(style){
        return JSFontDescriptor.initWithProperties(this._family, this._weight, style);
    }

});

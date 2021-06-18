// #import Foundation
"use strict";

JSClass("CHTheme", JSObject, {

    initWithColors: function(colors){
        this.colors = JSCopy(colors);
    },

    colors: null

});

Object.defineProperties(CHTheme, {
    default: {
        configurable: true,
        get: function(){
            var colors = [
                JSColor.initWithRGBAHexString("3399CC"),
                JSColor.initWithRGBAHexString("33CC80"),
                JSColor.initWithRGBAHexString("CC9933"),
                JSColor.initWithRGBAHexString("CC3333"),
                JSColor.initWithRGBAHexString("8033CC")
            ];
            var theme = CHTheme.initWithColors(colors);
            Object.defineProperty(this, "default", {value: theme});
            return theme;
        }
    }
});
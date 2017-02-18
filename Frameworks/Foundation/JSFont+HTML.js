// #import "Foundation/JSFont.js"
/* global JSFont */
'use strict';

JSFont.definePropertiesFromExtensions({
    cssString: function(){
        return '%d %s %fpx/%fpx %s'.sprintf(
            this._descriptor._weight,
            this._descriptor._style,
            this._pointSize,
            this._lineHeight,
            this._descriptor._family
        );
    }
});
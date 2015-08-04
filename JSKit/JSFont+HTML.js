// #import "JSKit/JSFont.js"
/* global JSFont */
'use strict';

JSFont.definePropertiesFromExtensions({
    cssString: function(){
        // TODO: weight, style, line height?
        return '%spx %s'.sprintf(this.pointSize, this.familyName);
    }
});
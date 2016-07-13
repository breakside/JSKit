// #import "Foundation/JSColor.js"
/* global JSColor */
'use strict';

JSColor.definePropertiesFromExtensions({
    cssString: function(){
        if (this.colorSpace === JSColor.SpaceIdentifier.RGBA){
            return 'rgba(' + this.components.join(',') + ')';
        }else if (this.colorSpace === JSColor.SpaceIdentifier.RGB){
            return 'rgb(' + this.components.join(',') + ')';
        }else if (this.colorSpace === JSColor.SpaceIdentifier.HSLA){
            return 'hsla(' + this.components.join(',') + ')';
        }else if (this.colorSpace === JSColor.SpaceIdentifier.HSL){
            return 'hsl(' + this.components.join(',') + ')';
        }else if (this.colorSpace === JSColor.SpaceIdentifier.GRAY){
            var w = this.components[0];
            return 'rgb(' + [w, w, w].join(',') + ')';
        }else{
            throw Error("Unsupported color space.  Cannot generate css string for '%s'".sprintf(this.colorSpace));
        }
    }
});
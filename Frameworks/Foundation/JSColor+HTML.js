// #import "Foundation/JSColor.js"
/* global JSColor */
'use strict';

JSColor.definePropertiesFromExtensions({
    cssString: function(){
        if (this.colorSpace === JSColor.SpaceIdentifier.RGBA){
            return 'rgba(%d, %d, %d, %f)'.sprintf(Math.round(this.components[0] * 255), Math.round(this.components[1] * 255), Math.round(this.components[2] * 255), this.components[3]);
        }else if (this.colorSpace === JSColor.SpaceIdentifier.RGB){
            return 'rgb(%d, %d, %d)'.sprintf(Math.round(this.components[0] * 255), Math.round(this.components[1] * 255), Math.round(this.components[2] * 255), this.components[3]);
        }else if (this.colorSpace === JSColor.SpaceIdentifier.HSLA){
            return 'hsla(%d, %d, %d, %f)'.sprintf(Math.round(this.components[0] * 255), Math.round(this.components[1] * 255), Math.round(this.components[2] * 255), this.components[3]);
        }else if (this.colorSpace === JSColor.SpaceIdentifier.HSL){
            return 'hsl(%d, %d, %d)'.sprintf(Math.round(this.components[0] * 255), Math.round(this.components[1] * 255), Math.round(this.components[2] * 255), this.components[3]);
        }else if (this.colorSpace === JSColor.SpaceIdentifier.GRAY){
            var w = Math.round(this.components[0] * 255);
            return 'rgb(' + [w, w, w].join(',') + ')';
        }else{
            throw Error("Unsupported color space.  Cannot generate css string for '%s'".sprintf(this.colorSpace));
        }
    }
});
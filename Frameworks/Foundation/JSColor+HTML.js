// #import "Foundation/JSColor.js"
/* global JSColor */
'use strict';

JSColor.definePropertiesFromExtensions({
    cssString: function(){
        if (this.colorSpace === JSColor.SpaceIdentifier.rgba){
            return 'rgba(%d, %d, %d, %f)'.sprintf(Math.round(this.components[0] * 255), Math.round(this.components[1] * 255), Math.round(this.components[2] * 255), this.components[3]);
        }else if (this.colorSpace === JSColor.SpaceIdentifier.rgb){
            return 'rgb(%d, %d, %d)'.sprintf(Math.round(this.components[0] * 255), Math.round(this.components[1] * 255), Math.round(this.components[2] * 255), this.components[3]);
        }else if (this.colorSpace === JSColor.SpaceIdentifier.hsla){
            return 'hsla(%d, %d, %d, %f)'.sprintf(Math.round(this.components[0] * 255), Math.round(this.components[1] * 255), Math.round(this.components[2] * 255), this.components[3]);
        }else if (this.colorSpace === JSColor.SpaceIdentifier.hsl){
            return 'hsl(%d, %d, %d)'.sprintf(Math.round(this.components[0] * 255), Math.round(this.components[1] * 255), Math.round(this.components[2] * 255), this.components[3]);
        }else if (this.colorSpace === JSColor.SpaceIdentifier.gray || this.colorSpace === JSColor.SpaceIdentifier.graya){
            var w = Math.round(this.components[0] * 255);
            var a = 1;
            if (this.colorSpace === JSColor.SpaceIdentifier.graya){
                a = this.alpha;
            }
            return 'rgba(' + [w, w, w, a].join(',') + ')';
        }else{
            throw Error("Unsupported color space.  Cannot generate css string for '%s'".sprintf(this.colorSpace));
        }
    }
});
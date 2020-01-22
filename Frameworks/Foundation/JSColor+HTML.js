// #import "JSColor.js"
'use strict';

JSColor.definePropertiesFromExtensions({

    _cachedCSSString: null,

    cssString: function(){
        if (this._cachedCSSString === null){
            if (this.colorSpace === JSColor.SpaceIdentifier.rgba){
                this._cachedCSSString = 'rgba(%d, %d, %d, %f)'.sprintf(Math.round(this.components[0] * 255), Math.round(this.components[1] * 255), Math.round(this.components[2] * 255), this.components[3]);
            }else if (this.colorSpace === JSColor.SpaceIdentifier.rgb){
                this._cachedCSSString = 'rgb(%d, %d, %d)'.sprintf(Math.round(this.components[0] * 255), Math.round(this.components[1] * 255), Math.round(this.components[2] * 255), this.components[3]);
            }else if (this.colorSpace === JSColor.SpaceIdentifier.hsla){
                this._cachedCSSString = 'hsla(%d, %d, %d, %f)'.sprintf(Math.round(this.components[0] * 255), Math.round(this.components[1] * 255), Math.round(this.components[2] * 255), this.components[3]);
            }else if (this.colorSpace === JSColor.SpaceIdentifier.hsl){
                this._cachedCSSString = 'hsl(%d, %d, %d)'.sprintf(Math.round(this.components[0] * 255), Math.round(this.components[1] * 255), Math.round(this.components[2] * 255), this.components[3]);
            }else if (this.colorSpace === JSColor.SpaceIdentifier.gray || this.colorSpace === JSColor.SpaceIdentifier.graya){
                var w = Math.round(this.components[0] * 255);
                var a = 1;
                if (this.colorSpace === JSColor.SpaceIdentifier.graya){
                    a = this.alpha;
                }
                this._cachedCSSString = 'rgba(%d, %d, %d, %f)'.sprintf(w, w, w, a);
            }else{
                throw Error("Unsupported color space.  Cannot generate css string for '%s'".sprintf(this.colorSpace));
            }
        }
        return this._cachedCSSString;
    }
});
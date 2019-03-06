// #import "Foundation/JSFontDescriptor.js"
/* global window, FontFace, JSFontDescriptor, JSResourceFontDescriptor, JSDataFontDescriptor */
'use strict';

(function(){

JSFontDescriptor.definePropertiesFromExtensions({

    htmlURLString: function(){
        return null;
    },

    htmlFontFace: function(){
        var url = this.htmlURLString();
        if (url){
            return new FontFace(this._family, 'url("%s")'.sprintf(url), {
                style: this._style,
                weight: this._weight
            });
        }
    },

    cssFontFaceRuleString: function(){
        var url = this.htmlURLString();
        if (url){
            return [
                '@font-face{',
                'font-family: "%s";'.sprintf(this._family),
                'font-style: %s;'.sprintf(this._style),
                'font-weight: %d;'.sprintf(Math.floor(this._weight)),
                'font-display: block;',
                'src: url("%s");'.sprintf(url),
                '}'
            ].join("\n");
        }
        return null;
    }

});

JSResourceFontDescriptor.definePropertiesFromExtensions({

    htmlURLString: function(){
        return this.metadata.htmlURL;
    },

});

JSDataFontDescriptor.definePropertiesFromExtensions({

    htmlURLString: function(){
        return this.data.htmlURLString();
    },

    htmlCleanup: function(){
        this.data.htmlCleanup();
    },

    htmlFontFace: function(){
        if (!this._htmlFontFace){
            this._htmlFontFace = new FontFace(this._family, this.data, {
                style: this._style,
                weight: this._weight
            });
        }
        return this._htmlFontFace;
    },

});

})();
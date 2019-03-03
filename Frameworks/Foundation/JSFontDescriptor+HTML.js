// #import "Foundation/JSFontDescriptor.js"
/* global JSFontDescriptor, JSResourceFontDescriptor, JSDataFontDescriptor */
'use strict';

(function(){

JSFontDescriptor.definePropertiesFromExtensions({

    htmlURLString: function(){
        return null;
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

});

})();
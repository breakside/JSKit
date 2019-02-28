// #import "Foundation/JSFontDescriptor.js"
/* global JSFontDescriptor, JSResourceFontDescriptor, JSDataFontDescriptor */
'use strict';

(function(){

JSFontDescriptor.definePropertiesFromExtensions({

    htmlURLString: function(){
        return "";
    },

    cssFontFaceRuleString: function(){
        var ruleText = [
            '@font-face{',
            'font-family: "%s";'.sprintf(this._family),
            'font-style: %s;'.sprintf(this._style),
            'font-weight: %d;'.sprintf(Math.floor(this._weight)),
            'font-display: block;',
            'src: url("%s");'.sprintf(this.htmlURLString()),
            '}'
        ].join("\n");
    }

});

JSResourceFontDescriptor.definePropertiesFromExtensions({

    htmlURLString: function(){
        return this.metadata.htmlURL;
    },

});

JSDataFontDescriptor.definePropertiesFromExtensions({

    htmlURLString: function(){
        return this.data.htmlURLstring();
    },

});

})();
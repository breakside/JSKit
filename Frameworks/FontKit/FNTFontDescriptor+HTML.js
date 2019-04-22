// #import "FNTFontDescriptor.js"
/* global FNTFontDescriptor */
'use strict';

(function(){

FNTFontDescriptor.definePropertiesFromExtensions({

    htmlURLString: function(){
        return this.font.data.htmlURLString();
    },

});

})();
// #import "FNTFontDescriptor.js"
'use strict';

(function(){

FNTFontDescriptor.definePropertiesFromExtensions({

    htmlURLString: function(){
        return this.font.data.htmlURLString();
    },

});

})();
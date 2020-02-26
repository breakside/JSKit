// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #import "JSFontDescriptor.js"
// jshint browser: true
/* global FontFace */
'use strict';

(function(){

JSFontDescriptor.definePropertiesFromExtensions({

    htmlURLString: function(){
        return null;
    },

    cssString: function(pointSize, lineHeight){
        return '%d %s %fpx/%fpx "%s"'.sprintf(
            this._weight,
            this._style,
            pointSize,
            lineHeight,
            this._family
        );
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
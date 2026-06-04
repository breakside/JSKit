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

// #import "JSImage.js"
'use strict';

_JSResourceImage.definePropertiesFromExtensions({
    htmlURLString: function(){
        return this.metadata.htmlURL;
    }
});

_JSDataImage.definePropertiesFromExtensions({
    htmlURLString: function(){
        return this.data.htmlURLString(this.contentType);
    }
});

_JSURLImage.definePropertiesFromExtensions({
    htmlURLString: function(){
        return this.url.encodedString;
    }
});

JSImage.definePropertiesFromExtensions({

    _htmlImage: null,
    _htmlImagePromise: null,

    preloadForHTMLContexts: function(){
        if (this._htmlImagePromise === null){
            var image = this;
            this._htmlImagePromise = new Promise(function(resolve, reject){
                var htmlImage = new JSGlobalObject.Image();
                htmlImage.src = image.htmlURLString();
                htmlImage.onload = function(){
                    resolve(htmlImage);
                };
                htmlImage.onerror = function(){
                    reject(new Error("failed to load image"));
                };
            }).then(function(htmlImage){
                image._htmlImage = htmlImage;
            });
        }
        return this._htmlImagePromise;
    }

});

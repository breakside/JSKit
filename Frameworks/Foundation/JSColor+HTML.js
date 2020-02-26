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
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

// #import Foundation
'use strict';

JSColor.definePropertiesFromExtensions({

    pdfFillColorCommand: function(){
        switch (this.colorSpace){
            case JSColor.SpaceIdentifier.rgb:
            case JSColor.SpaceIdentifier.rgba:
                return "%f %f %f rg ".sprintf(this.red, this.green, this.blue);
            case JSColor.SpaceIdentifier.hsl:
            case JSColor.SpaceIdentifier.hsla:
                return this.rgbaColor().pdfFillColorCommand();
            case JSColor.SpaceIdentifier.gray:
            case JSColor.SpaceIdentifier.graya:
                return "%f g ".sprintf(this.white);
        }
    },

    pdfStrokeColorCommand: function(){
        return this.pdfFillColorCommand().toUpperCase();
    }
});
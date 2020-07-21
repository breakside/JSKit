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

// #import "QRCode.js"
'use strict';

JSContext.definePropertiesFromExtensions({

    drawQRCode: function(qrCode, rect){
        var drawing = qrCode.prepareDrawing();
        this.save();
        var size = drawing.size;
        var modules = drawing.modules;
        var transform = JSAffineTransform.Translated(rect.origin.x, rect.origin.y).scaledBy(rect.size.width / drawing.size, rect.size.height / drawing.size);
        this.concatenate(transform);
        for (var y = 0, i = 0; y < size; ++y){
            for (var x = 0; x < size; ++x, ++i){
                if ((modules[i] & QRCodeDrawing.Flag.on) == QRCodeDrawing.Flag.on){
                    this.fillRect(JSRect(x, y, 1, 1));
                    // overdraw to cover gaps between adjacent squares caused by rounding errors
                    if (x > 0 && (modules[i - 1] & QRCodeDrawing.Flag.on) == QRCodeDrawing.Flag.on){
                        this.fillRect(JSRect(x - 0.5, y, 1, 1));
                    }
                    if (y > 0 && (modules[i - size] & QRCodeDrawing.Flag.on) == QRCodeDrawing.Flag.on){
                        this.fillRect(JSRect(x, y - 0.5, 1, 1));
                    }
                }
            }
        }
        this.restore();
    }

});
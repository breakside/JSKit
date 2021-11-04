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

// #import "UILayer.js"
'use strict';

JSClass("UIImageLayer", UILayer, {

    image: JSDynamicProperty('_image', null),
    imageFrame: JSDynamicProperty('_imageFrame', null),
    templateColor: UILayerAnimatedProperty(),
    automaticRenderMode: JSDynamicProperty('_automaticRenderMode', JSImage.RenderMode.original),

    init: function(){
        UIImageLayer.$super.init.call(this);
        this._imageFrame = JSRect.Zero;
        this.model.templateColor = JSColor.black;
    },

    getImage: function(){
        return this._image;
    },

    setImage: function(image){
        if (image === this._image){
            return;
        }
        this._image = image;
        this.setNeedsDisplay();
    },

    setImageFrame: function(imageFrame){
        this._imageFrame = imageFrame;
        this.setNeedsDisplay();
    },

    drawInContext: function(context){
        if (this._image !== null && this._imageFrame.size.width > 0 && this._imageFrame.size.height > 0){
            if (this._image.renderMode === JSImage.RenderMode.template || (this._image.renderMode === JSImage.RenderMode.automatic && this._automaticRenderMode === JSImage.RenderMode.template)){
                context.setFillColor(this.presentation.templateColor);
                context.fillMaskedRect(this._imageFrame, this._image);
            }else{
                context.drawImage(this._image, this._imageFrame);
            }
        }
    },

    setAutomaticRenderMode: function(renderMode){
        if (renderMode === this._automaticRenderMode){
            return;
        }
        this._automaticRenderMode = renderMode;
        this.setNeedsDisplay();
    },

    sizeToFit: function(){
        if (this._image !== null){
            this.bounds = JSRect(JSPoint.Zero, this._image.size);
        }
    }

});

UIImageLayer.Properties = Object.create(UILayer.Properties, {

    templateColor: {
        writable: true,
        value: null
    }

});
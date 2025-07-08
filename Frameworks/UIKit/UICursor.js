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
/* global UIApplication */
'use strict';

JSClass("UICursor", JSObject, {

    _scaledImages: null,
    hotSpot: JSPoint.Zero,
    systemIdentifier: null,

    initWithSystemIdentifier: function(systemIdentifier){
        this.systemIdentifier = systemIdentifier;
    },

    initWithImageNamed: function(imageName, hotSpot, bundle){
        bundle = bundle || JSBundle.mainBundle;
        var setName = imageName + '.imageset';
        var set = bundle.metadataForResourceName('Contents', 'json', setName);
        var info;
        var image;
        var scaledImages = [];
        var metadata;
        if (set !== null){
            set = set.value;
            for (var i = 0, l = set.images.length; i < l; ++i){
                info = set.images[i];
                metadata = JSCopy(bundle.metadataForResourceName(info.filename, null, setName));
                metadata.scale = info.scale || 1;
                image = JSImage.initWithResourceMetadata(metadata, bundle);
                scaledImages.push(image);
            }
        }else{
            image = JSImage.initWithResourceName(imageName, bundle);
            scaledImages.push(image);
        }
        this._initWithScaledImages(scaledImages, hotSpot);
    },

    initWithImage: function(image, hotSpot){
        this._initWithScaledImages([image], hotSpot);
    },

    _initWithScaledImages: function(scaledImages, hotSpot){
        this._scaledImages = scaledImages;
        this.hotSpot = JSPoint(hotSpot);
    },

    cssStrings: function(){
        if (this.systemIdentifier !== null){
            return [this.systemIdentifier];
        }
        var image1x = this._scaledImages[0];
        var image;
        var imageSet = [];
        for (var i = 0, l = this._scaledImages.length; i < l; ++i){
            image = this._scaledImages[i];
            if (image.scale === 1){
                image1x = image;
            }
            imageSet.push('url("%s") %fx'.sprintf(image.htmlURLString(), image.scale));
        }
        var fallbackCSS = 'url("%s") %d %d, default'.sprintf(image1x.htmlURLString(), this.hotSpot.x, this.hotSpot.y);
        var webkitCSS = '-webkit-image-set(%s) %d %d, default'.sprintf(imageSet.join(", "), this.hotSpot.x, this.hotSpot.y);
        return [webkitCSS, fallbackCSS];
    },

    push: function(){
        UICursor.push(this);
    },

    pop: function(){
        UICursor.pop();
    },

    set: function(){
        UICursor.set(this);
    },

    unset: function(){
        UICursor.set(UICursor.systemDefault);
    }

});

UICursor.hide = function(){
    if (UICursor._hideCount === 0){
        UIApplication.shared.windowServer.hideCursor();
    }
    ++UICursor._hideCount;
};

UICursor.unhide = function(){
    if (UICursor._hideCount === 0){
        return;
    }
    --UICursor._hideCount;
    if (UICursor._hideCount === 0){
        UIApplication.shared.windowServer.unhideCursor();
    }
};

UICursor.push = function(cursor){
    UICursor._stack.push(cursor);
    UICursor.update();
};

UICursor.pop = function(){
    if (UICursor._stack.length > 1){
        UICursor._stack.pop();
        UICursor.update();
    }
};

UICursor.set = function(cursor){
    UICursor._stack[0] = cursor;
    UICursor.update();
};

UICursor.update = function(){
    if (this._hideCount === 0){
        UIApplication.shared.windowServer.setCursor(UICursor.currentCursor);
    }
};

Object.defineProperties(UICursor, {
    currentCursor: {
        get: function UICursor_getCurrentCursor(){
            return UICursor._stack[UICursor._stack.length - 1];
        }
    }
});

UICursor.SystemIdentifier = {
    none: 'none',
    arrow: 'default',
    iBeam: 'text',
    pointingHand: 'pointer',
    operationNotAllowed: 'not-allowed',
    resizeLeftRight: 'col-resize',
    resizeUpDown: 'row-resize',
    resizeEastWest: 'ew-resize',
    resizeNorthSouth: 'ns-resize',
    resizeNorthEastSouthWest: 'nesw-resize',
    resizeNorthWestSouthEast: 'nwse-resize',
    openHand: 'grab',
    closedHand: 'grabbing',
    dragLink: 'alias',
    dragCopy: 'copy',
    crosshair: 'crosshair'
};

UICursor.none = UICursor.initWithSystemIdentifier(UICursor.SystemIdentifier.none);
UICursor.arrow = UICursor.initWithSystemIdentifier(UICursor.SystemIdentifier.arrow);
UICursor.iBeam = UICursor.initWithSystemIdentifier(UICursor.SystemIdentifier.iBeam);
UICursor.pointingHand = UICursor.initWithSystemIdentifier(UICursor.SystemIdentifier.pointingHand);
UICursor.operationNotAllowed = UICursor.initWithSystemIdentifier(UICursor.SystemIdentifier.operationNotAllowed);
UICursor.resizeLeftRight = UICursor.initWithSystemIdentifier(UICursor.SystemIdentifier.resizeLeftRight);
UICursor.resizeUpDown = UICursor.initWithSystemIdentifier(UICursor.SystemIdentifier.resizeUpDown);
UICursor.resizeEastWest = UICursor.initWithSystemIdentifier(UICursor.SystemIdentifier.resizeEastWest);
UICursor.resizeNorthSouth = UICursor.initWithSystemIdentifier(UICursor.SystemIdentifier.resizeNorthSouth);
UICursor.resizeNorthEastSouthWest = UICursor.initWithSystemIdentifier(UICursor.SystemIdentifier.resizeNorthEastSouthWest);
UICursor.resizeNorthWestSouthEast = UICursor.initWithSystemIdentifier(UICursor.SystemIdentifier.resizeNorthWestSouthEast);
UICursor.openHand = UICursor.initWithSystemIdentifier(UICursor.SystemIdentifier.openHand);
UICursor.closedHand = UICursor.initWithSystemIdentifier(UICursor.SystemIdentifier.closedHand);
UICursor.dragLink = UICursor.initWithSystemIdentifier(UICursor.SystemIdentifier.dragLink);
UICursor.dragCopy = UICursor.initWithSystemIdentifier(UICursor.SystemIdentifier.dragCopy);
UICursor.crosshair = UICursor.initWithSystemIdentifier(UICursor.SystemIdentifier.crosshair);

UICursor._hideCount = 0;
UICursor.systemDefault = UICursor.arrow;
UICursor._stack = [UICursor.systemDefault];
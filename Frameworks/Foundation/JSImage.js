// #import "Foundation/CoreTypes.js"
// #import "Foundation/JSObject.js"
// #import "Foundation/JSData.js"
// #import "Foundation/JSBundle.js"
/* global JSClass, JSObject, JSBundle, JSImage, JSData, JSConstraintBox */
'use strict';

JSClass('JSImage', JSObject, {

    resourceName: null,
    resource: null,
    data: null,
    file: null,
    width: 0,
    height: 0,
    stretchBox: null,
    scale: 1,

    init: function(){
    },

    initWithResourceName: function(name){
        this.resourceName = name;
        this.resource = JSBundle.mainBundle.resourceNamed(this.resourceName);
        this.width = this.resource.width;
        this.height = this.resource.height;
        Object.defineProperty(this, 'data', {
            configurable: true,
            get: JSImage.prototype._getDataFromResource
        });
    },

    stretchableImageWithCapSizes: function(leftCapWidth, topCapHeight, rightCapWidth, bottomCapHeight){
        var image = JSImage.init();
        image.width = this.width;
        image.height = this.height;
        if (this.resource !== null){
            image.resourceName = this.resourceName;
            image.resource = this.resource;
        }else if (this.file !== null){
            image.file = this.file;
        }else if (this.data !== null){
            image.data = this.data;
        }
        if (rightCapWidth === undefined){
            rightCapWidth = leftCapWidth;
        }
        if (bottomCapHeight === undefined){
            bottomCapHeight = topCapHeight;
        }
        image.stretchBox = JSConstraintBox.Margin(topCapHeight, rightCapWidth, bottomCapHeight, leftCapWidth);
        return image;
    },

    initWithData: function(data){
        this.data = data;
        if (this.data.bytes.length >= 16){
            // PNG magic bytes
            if (this.data.bytes[0] == 0x89 &&
                this.data.bytes[1] == 0x50 &&
                this.data.bytes[2] == 0x4E &&
                this.data.bytes[3] == 0x47 &&
                this.data.bytes[4] == 0x0D &&
                this.data.bytes[5] == 0x0A &&
                this.data.bytes[6] == 0x1A &&
                this.data.bytes[7] == 0x0A)
            {
                // Verifying "IHDR" signature
                if (this.data.bytes[10] == 0x49 && this.data.bytes[11] == 0x48 && this.data.bytes[12] == 0x44 && this.data.bytes[13] == 0x52){
                    this.width = (this.data.bytes[14] << 8) | this.data.bytes[15];
                    this.height = (this.data.bytes[16] << 8) | this.data.bytes[17];
                }else{
                    // Invalid PNG
                }
            // JPEG magic bytes
            }else if (this.data.bytes[0] == 0xFF && this.data.bytes[1] == 0xD8){
                // TODO: JPEG
            }else{
                // Not a PNG or JPEG
            }
        }else{
            // Very small, not enough room for a PNG header
        }
    },

    _getDataFromResource: function(){
        // TODO: overwritten by the renderer?
    },

    // initWithFile: function(file){
    //     this.file = file;
    //     // TODO: width & height
    //     Object.define(this, 'data', {
    //         configurable: true,
    //         writable: true,
    //         get: JSImage.prototype._getDataFromFile
    //     });
    // },

    // _getDataFromFile: function(){
    //     var reader = new FileReaderSync(); // FIXME: not available except in web worker
    //     var bytes = reader.readAsArrayBuffer(this.file);
    //     this.data = JSData.initWithBytes(bytes);
    //     return this.data;
    // },

});
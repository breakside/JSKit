// #import "Foundation/JSObject.js"
// #import "Foundation/JSData.js"
// #import "Foundation/JSBundle.js"
/* global JSClass, JSObject, JSBundle, JSImage, JSData */
'use strict';

JSClass('JSImage', JSObject, {

    resourceName: null,
    resource: null,
    data: null,
    file: null,
    width: 0,
    height: 0,

    initWithResourceName: function(name){
        this.resourceName = name;
        this.resource = JSBundle.mainBundle.resourceNamed(this.resourceName);
        this.width = this.resource.width;
        this.height = this.resource.height;
        Object.define(this, 'data', {
            configurable: true,
            writable: true,
            get: JSImage.prototype._getDataFromResource
        });
    },

    initWithData: function(data){
        this.data = data;
        // TODO: width & height
    },

    initWithFile: function(file){
        this.file = file;
        // TODO: width & height
        Object.define(this, 'data', {
            configurable: true,
            writable: true,
            get: JSImage.prototype._getDataFromFile
        });
    },

    _getDataFromFile: function(){
        var reader = new FileReaderSync(); // FIXME: not available except in web worker
        var bytes = reader.readAsArrayBuffer(this.file);
        this.data = JSData.initWithBytes(bytes);
        return this.data;
    },

    _getDataFromResource: function(){
        // TODO: overwritten by the renderer?
    }

});

/* global JSGlobalObject, PDFIndirectObject */
'use strict';

JSGlobalObject.PDFIndirectObject = function(objectID, generation){
    if (this === undefined){
        return new PDFIndirectObject(objectID, generation);
    }
    if (objectID instanceof PDFIndirectObject){
        this.objectID = objectID.objectID;
        this.generation = objectID.generation;
        this.resolvedValue = objectID.resolvedValue;
    }else{
        this.objectID = objectID;
        this.generation = generation || 0;
    }
};

JSGlobalObject.PDFIndirectObject.prototype = {
    objectID: null,
    generation: null,
    resolvedValue: null,
    instanceClass: null
};
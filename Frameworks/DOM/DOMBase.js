'use strict';

JSGlobalObject.DOM = Object.create({}, {

    Node: {
        value: function Node(){
            throw new Error("use document.create*");
        }
    },

    Document: {
        value: function Document(){
            throw new Error("use DOM.createDocument()");
        }
    },

    DocumentType: {
        value: function DocumentType(){
            throw new Error("use DOM.createDocumentType()");
        }
    },

    ProcessingInstruction: {
        value: function ProcessingInstruction(){
            throw new Error("use DOM.createProcessingInstruction()");
        }
    },

    Element: {
        value: function Element(){
            throw new Error("use DOM.createElement()");
        }
    },

    Attr: {
        value: function Attr(){
            throw new Error("use DOM.createAttribute()");
        }
    },

    CharacterData: {
        value: function CharacterData(){
            throw new Error("use DOM.createTextNode()");
        }
    },

    Text: {
        value: function Text(){
            throw new Error("use DOM.createTextNode()");
        }
    },

    CDATASection: {
        value: function CDATASection(){
            throw new Error("use DOM.createCDATASection()");
        }
    },

    Comment: {
        value: function Comment(){
            throw new Error("use DOM.createComment()");
        }
    },

    _parseQualifiedName: {
        value: function(name){
            var index = name.indexOf(":");
            if (index < 0){
                return {localName: name, prefix: null};
            }
            return {
                localName: name.substr(index + 1),
                prefix: name.substr(0, index)
            };
        }
    }

});
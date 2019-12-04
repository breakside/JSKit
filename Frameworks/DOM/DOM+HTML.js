// #import "XMLParser.js"
/* global window, document */
'use strict';

window.DOM = {
    Node: window.Node,
    Document: window.Document,
    DocumentType: window.DocumentType,
    ProcessingInstruction: window.ProcessingInstruction,
    Element: window.Element,
    Attr: window.Attr,
    CharacterData: window.CharacterData,
    Text: window.Text,
    CDATASection: window.CDATASection,
    Comment: window.Comment,
    createDocument: function(namespace, qualifiedName, doctype){
        return document.implementation.createDocument(namespace, qualifiedName, doctype);
    },
    createDocumentType: function(name, publicId, systemId){
        return document.implementation.createDocumentType(name, publicId, systemId);
    }
};
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

// jshint browser: true
'use strict';

JSGlobalObject.DOM = {
    Node: JSGlobalObject.Node,
    Document: JSGlobalObject.Document,
    DocumentType: JSGlobalObject.DocumentType,
    ProcessingInstruction: JSGlobalObject.ProcessingInstruction,
    Element: JSGlobalObject.Element,
    Attr: JSGlobalObject.Attr,
    CharacterData: JSGlobalObject.CharacterData,
    Text: JSGlobalObject.Text,
    CDATASection: JSGlobalObject.CDATASection,
    Comment: JSGlobalObject.Comment,
    createDocument: function(namespace, qualifiedName, doctype){
        return document.implementation.createDocument(namespace, qualifiedName, doctype);
    },
    createHTMLDocument: function(title){
        return document.implementation.createHTMLDocument(title);
    },
    createDocumentType: function(name, publicId, systemId){
        return document.implementation.createDocumentType(name, publicId, systemId);
    }
};
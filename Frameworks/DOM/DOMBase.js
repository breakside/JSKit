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
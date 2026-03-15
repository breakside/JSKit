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

// #import "DocTopicBasedComponent.js"
'use strict';

 JSClass("DocExtension", DocTopicBasedComponent, {

    kind: 'extension',
    defaultChildKind: 'property',

    // --------------------------------------------------------------------
    // MARK: - Creating and populating

    extractPropertiesFromInfo: async function(info, documentation){
        await DocExtension.$super.extractPropertiesFromInfo.call(this, info, documentation);
        let i = this.name.indexOf("+");
        if (i < 0){
            i = this.name.indexOf("(");
            if (i < 0){
                throw new Error("Extension %s name must include a +".sprintf(this.name));
            }
        }
        if (this.name[i] === "("){
            this.extends = info.extends || this.name.substr(0, i).trim();
            i += 1;
            this.extensionName = this.name.substr(i, this.name.length - 1 - i);
        }else{
            this.extends = info.extends || this.name.substr(0, i);
            this.extensionName = this.name.substr(i + 1);
        }
    },

    populateRelationships: function(){
        DocExtension.$super.populateRelationships.call(this);
        var parts = this.extends.split('.');
        this.extendsComponent = this.componentForName(parts.shift());
        while (parts.length > 0 && this.extendsComponent !== null){
            this.extendsComponent = this.extendsComponent.childForName(parts.shift());
        }
        if (this.extendsComponent !== null){
            if (this.extendsComponent.kind === "class"){
                this.extendsComponent.addExtension(this);
            }else if (this.extendsComponent.kind === "enum"){
                this.extendsComponent.addExtension(this);
            }
        }
    },
    
    extends: null,
    extensionName: null,
    extendsComponent: null,

    // --------------------------------------------------------------------
    // MARK: - Naming

    getDisplayNameForKind: function(){
        return 'Extension';
    },

    // --------------------------------------------------------------------
    // MARK: - Generating HTML

    htmlArticleElements: function(document){
        var elements = DocExtension.$super.htmlArticleElements.call(this, document);
        var declaration = this.codeSectionElement(document, "Declaration", this.declarationCode(document));
        declaration.setAttribute("class", "declaration");
        elements.splice(1, 0, declaration);

        let extension = document.createElement('section');
        elements.push(extension);
        extension.setAttribute("class", "extension");
        let header = extension.appendChild(document.createElement("header"));
        let h1 = header.appendChild(document.createElement("h2"));
        h1.setAttribute("outline-level", "1");
        h1.appendChild(document.createTextNode("Adds To"));
        let p = extension.appendChild(document.createElement("p"));
        let code = p.appendChild(document.createElement("code"));
        let url = this.urlForCode(this.extends);
        if (url !== null){
            let a = code.appendChild(document.createElement("a"));
            a.setAttribute("href", url.encodedString);
            a.appendChild(document.createTextNode(this.extends));   
        }else{
            code.appendChild(document.createTextNode(this.extends));
        }

        return elements;
    },

    declarationCode: function(document){
        var tokens = [];
        if (this.extendsComponent !== null){
            if (this.extendsComponent.kind === "enum"){
                tokens.push({value: this.extends, link: true});
                tokens.push({value: "+= { ... }"});
            }else if (this.extendsComponent.kind === "class"){
                if (this.extendsComponent.inherits){
                    tokens.push({value: this.extends, link: true});
                    tokens.push({value: ".definePropertiesFromExtensions({ ... })"});
                }else{
                }
            }
        }
        if (tokens.length === 0){
            tokens.push({value: this.extends, link: true});
            tokens.push({value: "+= { ... }"});
        }
        var lines = [];
        lines.push(this.codeLineFromTokens(document, tokens));
        return lines;
    },

 });
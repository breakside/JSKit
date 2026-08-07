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

 JSClass("DocProtocol", DocTopicBasedComponent, {

    kind: 'protocol',
    defaultChildKind: 'method',

    // --------------------------------------------------------------------
    // MARK: - Creating and populating

    extractPropertiesFromInfo: async function(info, documentation){
        await DocProtocol.$super.extractPropertiesFromInfo.call(this, info, documentation);
        if (info.inherits){
            this.inherits = info.inherits;
        }
    },
    
    inherits: null,

    // --------------------------------------------------------------------
    // MARK: - Naming

    getDisplayNameForKind: function(){
        return 'Protocol';
    },

    // --------------------------------------------------------------------
    // MARK: - Generating HTML

    htmlArticleElements: function(document){
        var elements = DocProtocol.$super.htmlArticleElements.call(this, document);
        var declaration = this.codeSectionElement(document, "Declaration", this.declarationCode());
        declaration.setAttribute("class", "declaration");
        elements.splice(1, 0, declaration);

        if (this.inherits){
            let inherits = document.createElement('section');
            elements.push(inherits);
            inherits.setAttribute("class", "inherits");
            let header = inherits.appendChild(document.createElement("header"));
            let h1 = header.appendChild(document.createElement("h2"));
            h1.appendChild(document.createTextNode("Inherits From"));
            let p = inherits.appendChild(document.createElement("p"));
            let code = p.appendChild(document.createElement("code"));
            let url = this.urlForCode(this.inherits);
            if (url !== null){
                let a = code.appendChild(document.createElement("a"));
                a.setAttribute("href", url.encodedString);
                if (url.isAbsolute){
                    a.setAttribute("target", "_blank");
                    a.setAttribute("rel", "noopener noreferrer");
                }
                a.appendChild(document.createTextNode(this.inherits));   
            }else{
                code.appendChild(document.createTextNode(this.inherits));
            }
        }
        return elements;
    },

    declarationCode: function(){
        var parent = 'JSProtocol';
        if (this.inherits){
            parent = this.inherits;
        }
        return ['JSProtocol("%s", %s, { ... })'.sprintf(this.name, parent)];
    },

    typescriptDeclaration: function(container = null){
        if (this.isTypescript){
            return null;
        }
        let declaration = "";
        if (container === null){
            declaration += "declare ";
        }
        declaration += "interface %s".sprintf(this.name);
        if (this.inherits){
            declaration += " extends %s".sprintf(this.inherits);
        }
        declaration += "{\n";
        let namespaceChildren = [];
        for (let child of this.children){
            if (child.namespace === null){
                if (child.kind === "class" || child.kind === "dictionary" || child.kind === "enum" || child.kind === "protocol"){
                    namespaceChildren.push(child);
                }else if (child.kind === "init"){
                    let childDeclaration = child.typescriptDeclaration("class", true);
                    if (childDeclaration !== null){
                        let indented = childDeclaration.split("\n").map(l => "  " + l).join("\n");
                        declaration += "%s\n".sprintf(indented);
                    }
                }else{
                    let childDeclaration = child.typescriptDeclaration("interface");
                    if (childDeclaration !== null){
                        let indented = childDeclaration.split("\n").map(l => "  " + l).join("\n");
                        declaration += "%s\n".sprintf(indented);
                    }
                }
            }
        }
        declaration += "}";
        if (namespaceChildren.length > 0){
            declaration += "\n";
            if (container === null){
                declaration += "declare ";
            }
            declaration += "namespace %s{\n".sprintf(this.name);
            for (let child of namespaceChildren){
                let childDeclaration = child.typescriptDeclaration("namespace");
                if (childDeclaration !== null){
                    let indented = childDeclaration.split("\n").map(l => "  " + l).join("\n");
                    declaration += "%s\n".sprintf(indented);
                }
            }
            declaration += "}";
        }
        return declaration;
    }

 });
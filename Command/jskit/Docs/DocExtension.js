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
        this.extendsComponent = this.componentForDottedName(this.extends);
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
            if (url.isAbsolute){
                a.setAttribute("target", "_blank");
                a.setAttribute("rel", "noopener noreferrer");
            }
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

    typescriptDeclaration: function(container = null){
        if (this.isTypescript){
            return null;
        }
        if (this.extendsComponent !== null){
            if (this.extendsComponent.kind === "enum" && !this.extendsComponent.isTypescriptEnum()){
                return this.typescriptDeclarationForEnum(container, this.extendsComponent.valueType);
            }
        }
        if (this.extends === "Math"){
            return this.typescriptDeclarationForBuiltin("Math", "Math", container);
        }else if (this.extends === "Number"){
            return this.typescriptDeclarationForBuiltin("Number", "NumberConstructor", container);
        }else if (this.extends === "RegExp"){
            return this.typescriptDeclarationForBuiltin("RegExp", "RegExpConstructor", container);
        }
        let declaration = "interface %s{\n".sprintf(this.extends);
        let namespaceChildren = [];
        let extensionChildren = [];
        let hasInterface = false;
        for (let child of this.children){
            if (child.kind === "class" || child.kind === "dictionary" || child.kind === "enum" || child.kind === "protocol" || child.kind === "init" || ((child.kind === "method" || child.kind === "property") && child.isStatic)){
                namespaceChildren.push(child);
            }else if (child.kind === "extension"){
                extensionChildren.push(child);
            }else{
                let childDeclaration = child.typescriptDeclaration("interface");
                if (childDeclaration !== null){
                    let indented = childDeclaration.split("\n").map(l => "  " + l).join("\n");
                    declaration += "%s\n".sprintf(indented);
                    hasInterface = true;
                }
            }
        }
        declaration += "}";
        if (!hasInterface){
            declaration = "";
        }
        if (namespaceChildren.length > 0){
            if (declaration !== ""){
                declaration += "\n";
            }
            if (container === null){
                declaration += "declare ";
            }
            declaration += "namespace %s{\n".sprintf(this.extends);
            for (let child of namespaceChildren){
                let childDeclaration = child.typescriptDeclaration("namespace");
                if (childDeclaration !== null){
                    let indented = childDeclaration.split("\n").map(l => "  " + l).join("\n");
                    declaration += "%s\n".sprintf(indented);
                }
            }
            declaration += "}";
        }
        if (extensionChildren.length > 0){
            if (declaration !== ""){
                declaration += "\n";
            }
            for (let child of extensionChildren){
                let childDeclaration = child.typescriptDeclaration(container);
                if (childDeclaration !== null){
                    declaration += childDeclaration;
                }
            }
        }
        return declaration;
    },

    typescriptDeclarationForBuiltin: function(name, constructorName, container){
        let declaration = "interface %s{\n".sprintf(name);
        let constructorChildren = [];
        let hasInterface = false;
        for (let child of this.children){
            if (name !== constructorName && (child.kind === "class" || child.kind === "dictionary" || child.kind === "enum" || child.kind === "protocol" || child.kind === "init" || ((child.kind === "method" || child.kind === "property") && child.isStatic))){
                constructorChildren.push(child);
            }else{
                let childDeclaration = child.typescriptDeclaration("interface");
                if (childDeclaration !== null){
                    let indented = childDeclaration.split("\n").map(l => "  " + l).join("\n");
                    declaration += "%s\n".sprintf(indented);
                    hasInterface = true;
                }
            }
        }
        declaration += "}";
        if (!hasInterface){
            declaration = "";
        }
        if (constructorChildren.length > 0){
            if (declaration !== ""){
                declaration += "\n";
            }
            if (container === null){
                declaration += "declare ";
            }
            declaration += "interface %s{\n".sprintf(constructorName);
            for (let child of constructorChildren){
                let childDeclaration = child.typescriptDeclaration("interface");
                if (childDeclaration !== null){
                    let indented = childDeclaration.split("\n").map(l => "  " + l).join("\n");
                    declaration += "%s\n".sprintf(indented);
                }
            }
            declaration += "}";
        }
        return declaration;
    },

    typescriptDeclarationForEnum: function(container, valueType){
        if (valueType === "bitmask"){
            valueType = "number";
        }
        valueType = this.typescriptValueType(valueType);
        let declaration = "";
        if (container === null){
            declaration += "declare ";
        }
        declaration += "namespace %s{\n".sprintf(this.extends);
        let reservedChildren = [];
        let reservedKeywords = new Set(["switch", "default"]);
        for (let child of this.children){
            if (reservedKeywords.has(child.name)){
                reservedChildren.push(child);
            }else{
                let childDeclaration = child.typescriptDeclaration("namespace", valueType);
                if (childDeclaration !== null){
                    let indented = childDeclaration.split("\n").map(l => "  " + l).join("\n");
                    declaration += "%s\n".sprintf(indented);
                }
            }
        }
        declaration += "}";
        if (reservedChildren.length > 0){
            declaration += "\n";
            if (container === null){
                declaration += "declare ";
            }
            declaration += "namespace %s{\n".sprintf(this.extends);
            let names = [];
            for (let child of reservedChildren){
                let originalName = child.name;
                let alteredName = "_" + originalName;
                names.push([originalName, alteredName]);
                child.name = alteredName;
                let childDeclaration = child.typescriptDeclaration("namespace", valueType);
                if (childDeclaration !== null){
                    let indented = childDeclaration.split("\n").map(l => "  " + l).join("\n");
                    declaration += "%s\n".sprintf(indented);
                }
                child.name = originalName;
            }
            declaration += "  export {\n";
            for (let [originalName, alteredName] of names){
                declaration += "    %s as %s,\n".sprintf(alteredName, originalName);
            }
            declaration += "  }\n";
            declaration += "}";
        }
        return declaration;
    }

 });
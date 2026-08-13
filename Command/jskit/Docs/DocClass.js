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

JSClass("DocClass", DocTopicBasedComponent, {

    kind: 'class',
    defaultChildKind: 'property',

    // --------------------------------------------------------------------
    // MARK: - Creating and populating

    extractPropertiesFromInfo: async function(info, documentation){
        await DocClass.$super.extractPropertiesFromInfo.call(this, info, documentation);
        if (info.inherits){
            this.inherits = info.inherits;
        }
        if (info.anonymous){
            this.anonymous = info.anonymous;
        }
        if (info.implements){
            this.implements = info.implements;
        }

    },
    
    inherits: null,
    anonymous: false,
    implements: null,
    extensions: null,

    addExtension: function(extension){
        if (this.extensions === null){
            this.extensions = [];
        }
        this.extensions.push(extension);
    },

    extensionChildForName: function(name){
        if (this.extensions === null){
            return null;
        }
        for (let i = 0, l = this.extensions.length; i < l; ++i){
            let extension = this.extensions[i];
            let component = extension.childForName(name);
            if (component !== null){
                return component;
            }
        }
        return null;
    },

    // --------------------------------------------------------------------
    // MARK: - Naming

    getDisplayNameForKind: function(){
        if (this.anonymous){
            return 'Anonymous Class';
        }
        return 'Class';
    },

    // --------------------------------------------------------------------
    // MARK: - Generating HTML

    htmlArticleElements: function(document){
        var elements = DocClass.$super.htmlArticleElements.call(this, document);
        if (!this.anonymous){
            var declaration = this.codeSectionElement(document, "Declaration", this.declarationCode(document));
            declaration.setAttribute("class", "declaration");
            elements.splice(1, 0, declaration);
        }

        if (this.extensions !== null){
            for (let extension of this.extensions){
                elements = elements.concat(this.htmlArticleTopicsElements(document, extension.extensionName + " Extensions", extension.topics));
            }
        }

        if (this.inherits){
            let inherits = document.createElement('section');
            elements.push(inherits);
            inherits.setAttribute("class", "inherits");
            let header = inherits.appendChild(document.createElement("header"));
            let h1 = header.appendChild(document.createElement("h2"));
            h1.setAttribute("outline-level", "1");
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

        if (this.implements !== null){
            let section = document.createElement('section');
            elements.push(section);
            section.setAttribute("class", "implements");
            let header = section.appendChild(document.createElement("header"));
            let h1 = header.appendChild(document.createElement("h2"));
            h1.setAttribute("outline-level", "1");
            h1.appendChild(document.createTextNode("Implements"));
            let ul = section.appendChild(document.createElement("ul"));
            for (let i = 0, l = this.implements.length; i < l; ++i){
                let protocol = this.implements[i];
                let li = ul.appendChild(document.createElement('li'));
                let code = li.appendChild(document.createElement("code"));
                let url = this.urlForCode(protocol);
                if (url !== null){
                    let a = code.appendChild(document.createElement("a"));
                    a.setAttribute("href", url.encodedString);
                    if (url.isAbsolute){
                        a.setAttribute("target", "_blank");
                        a.setAttribute("rel", "noopener noreferrer");
                    }
                    a.appendChild(document.createTextNode(protocol));   
                }else{
                    code.appendChild(document.createTextNode(protocol));
                }
            }
        }

        return elements;
    },

    declarationCode: function(document){
        var lines = [];
        var tokens = [{value: 'class'}, {value: this.name, link: true}];
        if (this.inherits){
            tokens.push({value: 'extends'});
            tokens.push({value: this.inherits, link: true});
        }
        lines.push(this.codeLineFromTokens(document, tokens));
        return lines;
    },

    inhertitedComponentForName: function(name){
        let component = null;
        if (this.inherits){
            var inherits = this.parent.componentForName(this.inherits, this);
            if (inherits !== null){
                component = inherits.childForName(name);
            }
        }
        return component;
    },

    typescriptDeclaration: function(container = null){
        if (this.isTypescript){
            return null;
        }
        if (this.name === "String"){
            return this.typescriptDeclarationForBuiltin("String", "StringConstructor");
        }
        if (this.name === "JSData"){
            return this.typescriptDeclarationForBuiltin("Uint8Array", "Uint8ArrayConstructor");
        }
        if (this.name === "JSClass"){
            return this.typescriptDeclarationForJSClass();
        }
        if (this.name === "JSObject"){
            return this.typescriptDeclarationForJSObject();
        }
        let declaration = "";
        let name = this.name;
        if (name === "UIEvent"){
            name = "UIEventObject";
        }
        if (name === "UIPopupWindow"){
            declaration += "// @ts-ignore\n";
        }
        if (container === null){
            declaration += "declare ";
        }
        let childContainer = "class";
        if (this.anonymous){
            declaration += "type %s = {\n".sprintf(name);
            childContainer = "type";
        }else{
            declaration += "class %s".sprintf(name);
            if (this.inherits){
                declaration += " extends %s".sprintf(this.inherits);
            }
            if (this.implements !== null && this.implements.length > 0){
                declaration += " implements %s".sprintf(this.implements.join(", "));
            }
            declaration += "{\n";
        }
        let propertyValueTypesByName = {};
        let properties = [];
        for (let child of this.children){
            if (child.kind === "property"){
                if (!propertyValueTypesByName[child.name]){
                    propertyValueTypesByName[child.name] = child.valueType;
                    properties.push(child);
                }else{
                    if (child.valueType != propertyValueTypesByName[child.name]){
                        propertyValueTypesByName[child.name] += " | " + child.valueType;
                    }
                }
            }
        }
        let namespaceChildren = [];
        let constructors = [];
        let seenPropertyNames = new Set();
        for (let child of this.children){
            if (child.namespace === null){
                if (child.kind === "class" || child.kind === "dictionary" || child.kind === "protocol"){
                    namespaceChildren.push(child);
                    continue;
                }
                if (child.kind === "enum"){
                    namespaceChildren.push(child);
                    continue;
                }
                let childDeclaration = null;
                if (child.kind === "property"){
                    if (!seenPropertyNames.has(child.name)){
                        seenPropertyNames.add(child.name);
                        childDeclaration = child.typescriptDeclaration(childContainer, propertyValueTypesByName[child.name]);
                    }
                }else{
                    childDeclaration = child.typescriptDeclaration(childContainer);
                }
                if (childDeclaration !== null){
                    let indented = childDeclaration.split("\n").map(l => "  " + l).join("\n");
                    declaration += "%s\n".sprintf(indented);
                }
                if (child.kind === "constructor"){
                    constructors.push(child);
                }
            }
        }
        if (this.implements !== null){
            let childNames = new Set(this.children.map(c => c.name));
            for (let name of this.implements){
                let component = this.componentForDottedName(name);
                if (component !== null && component.kind === "protocol"){
                    for (let child of component.children){
                        if (child.kind === "enum"){
                            continue;
                        }
                        if (child.kind === "class"){
                            continue;
                        }
                        if (!childNames.has(child.name)){
                            let childDeclaration = child.typescriptDeclaration(childContainer);
                            if (childDeclaration !== null){
                                let indented = childDeclaration.split("\n").map(l => "  " + l).join("\n");
                                declaration += "%s\n".sprintf(indented);
                            }
                        }
                    }
                }
            }
        }
        declaration += "}";
        if (this.anonymous){
            declaration += ";";
        }
        if (namespaceChildren.length > 0){
            declaration += "\n";
            if (container === null){
                declaration += "declare ";
            }
            declaration += "namespace %s{\n".sprintf(name);
            for (let child of namespaceChildren){
                let childDeclaration = child.typescriptDeclaration("namespace");
                if (childDeclaration !== null){
                    let indented = childDeclaration.split("\n").map(l => "  " + l).join("\n");
                    declaration += "%s\n".sprintf(indented);
                }
            }
            declaration += "}";
        }
        if (constructors.length > 0){
            declaration += "\n";
            for (let child of constructors){
                let args = child.typescriptAgumentsDeclaration();
                if (container === null){
                    declaration += "declare ";
                }
                declaration += "function %s(%s): %s;\n".sprintf(name, args, name);
            }
        }
        return declaration;
    },

    typescriptDeclarationForBuiltin: function(name, constructorName){
        let declaration = "interface %s{\n".sprintf(name);
        let interfaceChildren = [];
        let namespaceChildren = [];
        let aliasNamespaceChildren = [];
        let enumChildren = [];
        let constructors = [];
        for (let child of this.children){
            if (child.kind === "init" || (child.kind === "method" && child.isStatic)){
                if (this.name !== name){
                    aliasNamespaceChildren.push(child);
                }else{
                    interfaceChildren.push(child);
                }
            }else if (child.kind === "enum"){
                enumChildren.push(child);
            }else if (child.kind === "class" || child.kind === "dictionary" || child.kind === "protocol" || (child.kind === "property" && child.isStatic)){
                namespaceChildren.push(child);
            }else{
                let childDeclaration = child.typescriptDeclaration("interface");
                if (childDeclaration !== null){
                    if (this.name === "JSData" && child.name === "length"){
                        continue;
                    }
                    let indented = childDeclaration.split("\n").map(l => "  " + l).join("\n");
                    declaration += "%s\n".sprintf(indented);
                }
            }
        }
        declaration += "}";
        if (enumChildren.length > 0){
            for (let child of enumChildren){
                let childDeclaration = child.typescriptDeclaration(null, "%s%s".sprintf(name, child.name));
                if (childDeclaration !== null){
                    declaration += "\n" + childDeclaration;
                }
            }
            declaration += "\n";
            declaration += "declare namespace %s{\n".sprintf(name);
            for (let child of enumChildren){
                declaration += "  type %s = %s%s;\n".sprintf(child.name, name, child.name);
            }
            declaration += "}";
        }
        if (interfaceChildren.length > 0){
            declaration += "\n";
            declaration += "interface %s{\n".sprintf(constructorName);
            for (let child of interfaceChildren){
                let childDeclaration = child.typescriptDeclaration("interface");
                if (childDeclaration !== null){
                    let indented = childDeclaration.split("\n").map(l => "  " + l).join("\n");
                    declaration += "%s\n".sprintf(indented);
                }
            }
            for (let child of enumChildren){
                declaration += "  readonly %s: typeof %s%s;\n".sprintf(child.name, name, child.name);
            }
            declaration += "}";
        }
        if (namespaceChildren.length > 0){
            declaration += "\n";
            declaration += "declare namespace %s{\n".sprintf(constructorName);
            for (let child of namespaceChildren){
                let childDeclaration = child.typescriptDeclaration("namespace");
                if (childDeclaration !== null){
                    let indented = childDeclaration.split("\n").map(l => "  " + l).join("\n");
                    declaration += "%s\n".sprintf(indented);
                }
            }
            declaration += "}";
        }
        if (this.name !== name){
            declaration += "\ntype %s = %s;".sprintf(this.name, name);
        }
        if (aliasNamespaceChildren.length > 0){
            declaration += "\ndeclare namespace %s{\n".sprintf(this.name);
            for (let child of aliasNamespaceChildren){
                let childDeclaration = child.typescriptDeclaration("namespace");
                if (childDeclaration !== null){
                    let indented = childDeclaration.split("\n").map(l => "  " + l).join("\n");
                    declaration += "%s\n".sprintf(indented);
                }
            }
            declaration += "}";
        }
        return declaration;
    },

    typescriptDeclarationForJSClass: function(){
        let constructorName = "%sConstructor".sprintf(this.name);
        let declaration = "interface %s{\n".sprintf(this.name);
        let constructors = [];
        let statics = [];
        for (let child of this.children){
            if (child.namespace === null){
                if (child.kind === "constructor"){
                    constructors.push(child);
                }else if ((child.kind === "property" || child.kind === "method") && child.isStatic){
                    statics.push(child);
                }else{
                    let childDeclaration = child.typescriptDeclaration("interface");
                    if (childDeclaration !== null){
                        let indented = childDeclaration.split("\n").map(l => "  " + l).join("\n");
                        declaration += "%s\n".sprintf(indented);
                    }
                }
            }
        }
        declaration += "}\n";
        declaration += "interface %s{\n".sprintf(constructorName);
        for (let child of constructors){
            declaration += "  (%s): %s;\n".sprintf(child.typescriptAgumentsDeclaration(), this.name);
            declaration += "  (cls: %s): void;\n".sprintf(this.name);
            declaration += "  new (%s): %s;\n".sprintf(child.typescriptAgumentsDeclaration(), this.name);
        }
        declaration += "  readonly prototype: %s;\n".sprintf(this.name);
        for (let child of statics){
            let childDeclaration = child.typescriptDeclaration("interface");
            if (childDeclaration !== null){
                let indented = childDeclaration.split("\n").map(l => "  " + l).join("\n");
                declaration += "%s\n".sprintf(indented);
            }
        }
        declaration += "}\n";
        declaration += "declare const %s: %s;".sprintf(this.name, constructorName);
        return declaration;
    },

    typescriptDeclarationForJSObject: function(){
        let declaration = "interface %s{\n".sprintf(this.name);
        let statics = [];
        for (let child of this.children){
            if (child.namespace === null){
                if (child.kind === "init"){
                    statics.push(child);
                    let childDeclaration = child.typescriptDeclaration("class", true);
                    if (childDeclaration !== null){
                        let indented = childDeclaration.split("\n").map(l => "  " + l).join("\n");
                        declaration += "%s\n".sprintf(indented);
                    }
                }else if ((child.kind === "property" || child.kind === "method") && child.isStatic){
                    statics.push(child);
                }else{
                    let childDeclaration = child.typescriptDeclaration("interface");
                    if (childDeclaration !== null){
                        let indented = childDeclaration.split("\n").map(l => "  " + l).join("\n");
                        declaration += "%s\n".sprintf(indented);
                    }
                }
            }
        }
        declaration += "}\n";
        declaration += "declare const %s: JSClass & {\n".sprintf(this.name);
        declaration += "  new (): JSObject;\n";
        declaration += "  readonly prototype: JSObject;\n";
        for (let child of statics){
            let childDeclaration = child.typescriptDeclaration("type");
            if (childDeclaration !== null){
                let indented = childDeclaration.split("\n").map(l => "  " + l).join("\n");
                declaration += "%s\n".sprintf(indented);
            }
        }
        declaration += "}\n";
        return declaration;
    }

 });

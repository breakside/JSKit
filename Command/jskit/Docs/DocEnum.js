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
/* global DocEnumOptions, DocEnumFunction */
'use strict';

 JSClass("DocEnum", DocTopicBasedComponent, {

    kind: 'enum',
    options: null,
    valueType: null,
    inherits: null,
    defaultChildKind: "enumoption",

    extractPropertiesFromInfo: async function(info, documentation){
        await DocEnum.$super.extractPropertiesFromInfo.call(this, info, documentation);
        if (info.options){
            this.options = info.options;
        }else{
            this.options = [];
        }
        if (info.type){
            this.valueType = info.type;
        }
        if (info.inherits){
            this.inherits = info.inherits;
        }
    },

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

    suffixForMember: function(member){
        if (member.isKindOfClass(DocEnumOption) && member.value !== null){
            return ": %s".sprintf(member.value);
        }
        if (member.isKindOfClass(DocEnumFunction)){
            var args = member.argumentStrings();
            return ": function(%s)".sprintf(args.join(', '));
        }
        return DocEnum.$super.suffixForMember.call(this, member);
    },

    nameForMember: function(member){
        return member.name;
    },

    getTitle: function(){
        return "%s.%s".sprintf(this.parent.name, this.name);
    },

    htmlArticleElements: function(document){
        var index = 1;
        var elements = DocEnum.$super.htmlArticleElements.call(this, document);
        var declaration = this.codeSectionElement(document, "Declaration", this.declarationCode());
        declaration.setAttribute("class", "declaration");
        elements.splice(index++, 0, declaration);
        if (this.extensions !== null){
            for (let extension of this.extensions){
                elements = elements.concat(this.htmlArticleTopicsElements(document, extension.extensionName + " Extensions", extension.topics));
            }
        }
        return elements;
    },

    declarationCode: function(){
        if (this.parent){
            if (this.parent.kind == 'class' || this.parent.kind == 'protocol'){
                return ["%s.%s = { ... }".sprintf(this.parent.name, this.name)];
            }
            if (this.parent.kind === "extension"){
                return ["%s.%s = { ... }".sprintf(this.parent.extends, this.name)];
            }
        }
        return ["%s = { ... }".sprintf(this.name)];
    },

    getDisplayNameForKind: function(){
        if (this.valueType){
            return "%s Enum".sprintf(this.valueType);
        }
        return 'Enum';
    },

    typescriptDeclaration: function(container = null, nameOverride = null){
        if (this.isTypescript){
            return null;
        }
        let name = nameOverride;
        if (!name){
            name = this.name;
        }
        let declaration = "";
        if (container === null){
            declaration += "declare ";
        }
        let childContainer = "enum";
        let childValueType = null;
        if (this.valueType === "bitmask"){
            childContainer = "class";
            childValueType = "number";
            declaration += "class %s".sprintf(name);
            if (this.inherits){
                declaration += " extends %s".sprintf(this.inherits);
            }
            declaration += "{\n";
        }else if (!this.isTypescriptEnum()){
            childValueType = this.valueType;
            declaration += "namespace %s{\n".sprintf(name);
            childContainer = "namespace";
        }else{
            declaration += "enum %s{\n".sprintf(name);
        }
        let reservedChildren = [];
        let reservedKeywords = new Set(["switch", "default"]);
        for (let child of this.children){
            if (childContainer === "namespace" && reservedKeywords.has(child.name)){
                reservedChildren.push(child);
            }else{
                if (child.kind === "enumfunction"){
                    // TODO:
                }else{
                    let childDeclaration = child.typescriptDeclaration(childContainer, childValueType);
                    if (childDeclaration !== null){
                        let indented = childDeclaration.split("\n").map(l => "  " + l).join("\n");
                        declaration += "%s\n".sprintf(indented);
                    }
                }
            }
        }
        declaration += "}";
        if (reservedChildren.length > 0){
            declaration += "\n";
            if (container === null){
                declaration += "declare ";
            }
            declaration += "namespace %s{\n".sprintf(name);
            let names = [];
            for (let child of reservedChildren){
                let originalName = child.name;
                let alteredName = "_" + originalName;
                names.push([originalName, alteredName]);
                child.name = alteredName;
                let childDeclaration = child.typescriptDeclaration("namespace", childValueType);
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
    },

    isTypescriptEnum: function(){
        if (this.valueType === null){
            return true;
        }
        let lowerValueType = this.valueType.toLowerCase();
        if (lowerValueType === "number"){
            return true;
        }
        if (lowerValueType === "int"){
            return true;
        }
        if (lowerValueType === "integer"){
            return true;
        }
        if (lowerValueType === "string"){
            return true;
        }
        return false;
    },

    typescriptName: function(){
        if (this.valueType === "bitmask"){
            return "number";
        }
        return DocEnum.$super.typescriptName.call(this);
    }

 });
// #import "DocComponent.js"
/* global JSClass, DocComponent, DocProperty */
'use strict';

 JSClass("DocProperty", DocComponent, {

    kind: 'property',
    isStatic: false,
    valueType: null,

    getDisplayNameForKind: function(){
        if (this.isStatic){
            return "Class Property";
        }
        return "Property";
    },

    extractPropertiesFromInfo: async function(info, documentation){
        if (info.type){
            this.valueType = info.type;
        }
        if (info.static){
            this.isStatic = true;
        }
    },

    getTitle: function(){
        return "%s.%s".sprintf(this.parent.name, this.name);
    },

    htmlArticleElements: function(document){
        let index = 1;
        var elements = DocProperty.$super.htmlArticleElements.call(this, document);
        var declaration = this.codeSectionElement(document, "Declaration", this.declarationCode());
        declaration.setAttribute("class", "declaration");
        elements.splice(index++, 0, declaration);

        if (this.valueType){
            let typeSection = document.createElement("section");
            elements.splice(index++, 0, typeSection);
            typeSection.setAttribute("class", "return");
            let header = typeSection.appendChild(document.createElement("header"));
            let h1 = header.appendChild(document.createElement("h1"));
            h1.appendChild(document.createTextNode("Value Type"));
            let p = typeSection.appendChild(document.createElement("p"));
            let code = p.appendChild(document.createElement("code"));
            let url = this.urlForCode(this.valueType);
            if (url){
                let a = code.appendChild(document.createElement("a"));
                a.setAttribute("href", url.encodedString);
                a.appendChild(document.createTextNode(this.valueType));
            }else{
                code.appendChild(document.createTextNode(this.valueType));
            }
        }

        return elements;
    },

    declarationCode: function(){
        if (this.isStatic){
            return ['static var %s'.sprintf(this.name)];
        }
        return ['var %s'.sprintf(this.name)];
    },

    // --------------------------------------------------------------------
    // MARK: - JSON

    jsonObject: function(baseURL){
        let obj = DocProperty.$super.jsonObject.call(this, baseURL);
        if (this.isStatic){
            obj.static = true;
        }
        return obj;
    }

 });
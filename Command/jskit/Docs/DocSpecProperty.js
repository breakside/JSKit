// #import "DocComponent.js"
/* global JSClass, DocComponent, DocSpecProperty */
'use strict';

 JSClass("DocSpecProperty", DocComponent, {

    kind: 'specproperty',
    valueType: null,

    getDisplayNameForKind: function(){
        return "Spec Property";
    },

    extractPropertiesFromInfo: async function(info, documentation){
        if (info.type){
            this.valueType = info.type;
        }
    },

    getTitle: function(){
        return "%s spec.%s".sprintf(this.parent.parent.name, this.name);
    },

    htmlArticleElements: function(document){
        let index = 1;
        var elements = DocSpecProperty.$super.htmlArticleElements.call(this, document);

        if (this.valueType){
            let typeSection = document.createElement("section");
            elements.splice(index++, 0, typeSection);
            typeSection.setAttribute("class", "return");
            let header = typeSection.appendChild(document.createElement("header"));
            let h1 = header.appendChild(document.createElement("h1"));
            h1.appendChild(document.createTextNode("Resolved Value Type"));
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

 });
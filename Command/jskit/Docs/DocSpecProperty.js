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
        await DocSpecProperty.$super.extractPropertiesFromInfo.call(this, info, documentation);
        if (info.type){
            this.valueType = info.type;
        }
    },

    htmlArticleElements: function(document){
        let index = 1;
        var elements = DocSpecProperty.$super.htmlArticleElements.call(this, document);

        if (this.valueType){
            let valueType = this.nameExcludingCodeSuffixes(this.valueType);
            let typeSection = document.createElement("section");
            elements.splice(index++, 0, typeSection);
            typeSection.setAttribute("class", "return");
            let header = typeSection.appendChild(document.createElement("header"));
            let h1 = header.appendChild(document.createElement("h1"));
            h1.appendChild(document.createTextNode("Resolved Value Type"));
            let p = typeSection.appendChild(document.createElement("p"));
            let code = p.appendChild(document.createElement("code"));
            let url = this.urlForCode(valueType + ".Spec File Properties");
            if (!url){
                url = this.urlForCode(valueType);
            }
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
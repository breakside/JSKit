// #import "DocComponent.js"
/* global JSClass, DocComponent, DocDictionaryProperty */
'use strict';

 JSClass("DocDictionaryProperty", DocComponent, {

    kind: 'dictproperty',
    valueType: null,

    getDisplayNameForKind: function(){
        return "%s Property".sprintf(this.parent.name);
    },

    extractPropertiesFromInfo: async function(info, documentation){
        await DocDictionaryProperty.$super.extractPropertiesFromInfo.call(this, info, documentation);
        if (info.type){
            this.valueType = info.type;
        }
    },

    getTitle: function(){
        return "%s.%s".sprintf(this.parent.name, this.name);
    },

    htmlArticleElements: function(document){
        let index = 1;
        var elements = DocDictionaryProperty.$super.htmlArticleElements.call(this, document);

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

 });
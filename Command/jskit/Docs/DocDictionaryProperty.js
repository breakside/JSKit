// #import "DocComponent.js"
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

        var variations = this.variations();
        if (variations.length > 0){
            let section = document.createElement("section");
            section.setAttribute("class", "variations");
            elements.push(section);
            let header = section.appendChild(document.createElement("header"));
            let h1 = header.appendChild(document.createElement("h1"));
            h1.appendChild(document.createTextNode("Alternate Forms"));

            let ul = section.appendChild(document.createElement("ul"));

            for (let i = 0, l = variations.length; i < l; ++i){
                let variation = variations[i];
                let url = this.urlForComponent(variation);
                let li = ul.appendChild(document.createElement("li"));
                li.setAttribute("class", variation.kind);
                let a = document.createElement("a");
                a.setAttribute("href", url.encodedString);
                let code = li.appendChild(document.createElement('code'));
                code.appendChild(a);
                a.appendChild(document.createTextNode(variation.name));
                if (variation.valueType){
                    code.appendChild(document.createTextNode(": %s".sprintf(variation.valueType)));
                }
                if (variation.summary){
                    let markdown = this.createMarkdownWithString(variation.summary);
                    let children = markdown.htmlElementsForDocument(document);
                    for (let j = 0, k = children.length; j < k; ++j){
                        li.appendChild(children[j]);
                    }

                }
            }
        }

        return elements;
    },

 });
// #import "DocComponent.js"
/* global JSClass, DocComponent, DocProperty */
'use strict';

 JSClass("DocProperty", DocComponent, {

    kind: 'property',
    isStatic: false,
    valueType: null,
    nullable: true,

    getDisplayNameForKind: function(){
        if (this.isStatic){
            return "Class Property";
        }
        return "Property";
    },

    extractPropertiesFromInfo: async function(info, documentation){
        await DocProperty.$super.extractPropertiesFromInfo.call(this, info, documentation);
        if (info.type){
            this.valueType = info.type;
        }
        if (info.static){
            this.isStatic = true;
        }
        if (info.nullable){
            this.nullable = true;
        }
    },

    getTitle: function(){
        if (this.isStatic){
            return "%s.%s".sprintf(this.parent.name, this.name);
        }
        return this.name;
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
            if (this.nullable){
                code.appendChild(document.createTextNode('?'));
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

    declarationCode: function(){
        if (this.isStatic){
            return ['nullable var %s'.sprintf(this.name)];
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
// #import "DocComponent.js"
/* global JSClass, DocComponent, DocEnumOption, DocFunction */
'use strict';

 JSClass("DocEnumOption", DocComponent, {

    kind: 'enumoption',
    value: null,
    nullable: false,

    getDisplayNameForKind: function(){
        return "Enum Option";
    },

    extractPropertiesFromInfo: async function(info, documentation){
        await DocEnumOption.$super.extractPropertiesFromInfo.call(this, info, documentation);
        if (info.value){
            this.value = info.value;
        }
    },

    getTitle: function(){
        var title = "%s.%s".sprintf(this.parent.name, this.name);
        if (this.parent.parent && this.parent.parent.kind == 'class' || this.parent.parent.kind == 'protocol'){
            title = "%s.%s".sprintf(this.parent.parent.name, title);
        }
        return title;
    },

    htmlArticleElements: function(document){
        let index = 1;
        var elements = DocEnumOption.$super.htmlArticleElements.call(this, document);
        var declaration = this.codeSectionElement(document, "Declaration", this.declarationCode());
        declaration.setAttribute("class", "declaration");
        elements.splice(index++, 0, declaration);

        if (this.value && typeof(this.value) == 'object'){
            var fn = DocFunction.init();
            fn._extractPropertiesFromInfo(this.value);
            if (fn.arguments.length > 0){
                let params = document.createElement("section");
                elements.splice(index++, 0, params);
                params.setAttribute("class", "parameters");
                let header = params.appendChild(document.createElement("header"));
                let h1 = header.appendChild(document.createElement("h1"));
                h1.setAttribute("outline-level", "1");
                h1.appendChild(document.createTextNode("Parameters"));
                let dl = fn.argumentListElement(document, this);
                params.appendChild(dl);
            }

            if (fn.returnValue){
                let returnSection = document.createElement("section");
                elements.splice(index++, 0, returnSection);
                returnSection.setAttribute("class", "return");
                let header = returnSection.appendChild(document.createElement("header"));
                let h1 = header.appendChild(document.createElement("h1"));
                h1.setAttribute("outline-level", "1");
                h1.appendChild(document.createTextNode("Return Value"));

                if (fn.returnValue){
                    let markdown = this.createMarkdownWithString(fn.returnValue);
                    let children = markdown.htmlElementsForDocument(document);
                    for (let i = 0, l = children.length; i < l; ++i){
                        returnSection.appendChild(children[i]);
                    }
                }
            }
        }

        return elements;
    },

    declarationCode: function(){
        if (this.value){
            return ['%s: %s'.sprintf(this.name, this.value)];
        }
        return ['%s'.sprintf(this.name)];
    },

 });
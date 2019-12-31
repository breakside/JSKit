// #import "DocTopicBasedComponent.js"
/* global JSClass, DocTopicBasedComponent, DocClass */
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
    },
    
    inherits: null,
    anonymous: false,

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
            var declaration = this.codeSectionElement(document, "Declaration", this.declarationCode());
            declaration.setAttribute("class", "declaration");
            elements.splice(1, 0, declaration);
        }

        if (this.inherits){
            let inherits = document.createElement('section');
            elements.push(inherits);
            inherits.setAttribute("class", "inherits");
            let header = inherits.appendChild(document.createElement("header"));
            let h1 = header.appendChild(document.createElement("h1"));
            h1.appendChild(document.createTextNode("Inherits From"));
            let p = inherits.appendChild(document.createElement("p"));
            let code = p.appendChild(document.createElement("code"));
            let url = this.urlForCode(this.inherits);
            if (url !== null){
                let a = code.appendChild(document.createElement("a"));
                a.setAttribute("href", url.encodedString);
                a.appendChild(document.createTextNode(this.inherits));   
            }else{
                code.appendChild(document.createTextNode(this.inherits));
            }
        }
        return elements;
    },

    declarationCode: function(){
        if (this.inherits){
            return ["class %s extends %s".sprintf(this.name, this.inherits)];
        }
        return ["class %s".sprintf(this.name)];
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

 });
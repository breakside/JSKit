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
        if (info.implements){
            this.implements = info.implements;
        }
    },
    
    inherits: null,
    anonymous: false,
    implements: null,

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

        if (this.inherits){
            let inherits = document.createElement('section');
            elements.push(inherits);
            inherits.setAttribute("class", "inherits");
            let header = inherits.appendChild(document.createElement("header"));
            let h1 = header.appendChild(document.createElement("h1"));
            h1.setAttribute("outline-level", "1");
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

        if (this.implements !== null){
            let section = document.createElement('section');
            elements.push(section);
            section.setAttribute("class", "implements");
            let header = section.appendChild(document.createElement("header"));
            let h1 = header.appendChild(document.createElement("h1"));
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

 });
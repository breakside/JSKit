// #import "DocComponent.js"
'use strict';

 JSClass("DocFunction", DocComponent, {

    kind: 'function',
    arguments: null,
    returnValue: null,
    valueType: null,
    promise: null,
    nullable: false,

    getDisplayNameForKind: function(){
        return "Function";
    },

    extractPropertiesFromInfo: async function(info, documentation){
        await DocFunction.$super.extractPropertiesFromInfo.call(this, info, documentation);
        this._extractPropertiesFromInfo(info, documentation);
    },

    _extractPropertiesFromInfo: function(info, documentation){
        if (info.arguments){
            this.arguments = info.arguments;
        }else{
            this.arguments = [];
        }
        if (info.return){
            this.returnValue = info.return;
        }
        if (info.type){
            this.valueType = info.type;
        }
        if (info.promise){
            this.promise = info.promise;
        }
        if (info.nullable){
            this.nullable = info.nullable;
        }
    },

    htmlArticleElements: function(document){
        var index = 1;
        var elements = DocFunction.$super.htmlArticleElements.call(this, document);
        var declaration = this.codeSectionElement(document, "Declaration", this.declarationCode());
        declaration.setAttribute("class", "declaration");
        elements.splice(index++, 0, declaration);

        if (this.arguments.length > 0){
            let params = document.createElement("section");
            elements.splice(index++, 0, params);
            params.setAttribute("class", "parameters");
            let header = params.appendChild(document.createElement("header"));
            let h1 = header.appendChild(document.createElement("h1"));
            h1.setAttribute("outline-level", "1");
            h1.appendChild(document.createTextNode("Parameters"));
            let dl = this.argumentListElement(document, this);
            params.appendChild(dl);
        }

        if (this.returnValue || this.valueType){
            let returnSection = document.createElement("section");
            elements.splice(index++, 0, returnSection);
            returnSection.setAttribute("class", "return");
            let header = returnSection.appendChild(document.createElement("header"));
            let h1 = header.appendChild(document.createElement("h1"));
            h1.setAttribute("outline-level", "1");
            h1.appendChild(document.createTextNode("Return Value"));
            if (this.valueType){
                let p = returnSection.appendChild(document.createElement("p"));
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
            if (this.promise){
                let dl = returnSection.appendChild(document.createElement('dl'));
                dl.setAttribute('class', 'promise');
                if (this.promise.resolve){
                    this.appendArgumentElements(dl, {name: "resolve", type: this.promise.resolve.type, summary: this.promise.resolve.summary}, this);
                }
            }
            if (this.returnValue){
                let markdown = this.createMarkdownWithString(this.returnValue);
                let children = markdown.htmlElementsForDocument(document);
                for (let i = 0, l = children.length; i < l; ++i){
                    returnSection.appendChild(children[i]);
                }
            }
        }

        return elements;
    },

    argumentListElement: function(document, resolver){
        let dl = document.createElement("dl");
        for (let i = 0, l = this.arguments.length; i < l; ++i){
            let arg = this.arguments[i];
            this.appendArgumentElements(dl, arg, resolver);
        }
        return dl;
    },

    appendArgumentElements: function(dl, arg, resolver){
        var document = dl.ownerDocument;
        let dt = dl.appendChild(document.createElement("dt"));
        let dd = dl.appendChild(document.createElement("dd"));
        dt.appendChild(document.createTextNode(arg.variable ? "%s...".sprintf(arg.name) : arg.name));
        if (arg.type){
            if (typeof(arg.type) === 'object'){
                var fn = DocFunction.init();
                fn._extractPropertiesFromInfo(arg.type);
                let code = dd.appendChild(document.createElement("code"));
                code.appendChild(document.createTextNode(fn.declarationCode()[0]));
                if (arg.nullable){
                    code.appendChild(document.createTextNode('?'));
                }
                let callbackDL = fn.argumentListElement(document, resolver);
                dd.appendChild(callbackDL);
                if (fn.returnValue || fn.valueType){
                    this.appendArgumentElements(callbackDL, {name: "Return Value", type: fn.valueType, summary: fn.returnValue}, resolver);
                }
            }else{
                let code = dd.appendChild(document.createElement("code"));
                let url = resolver.urlForCode(arg.type);
                if (url !== null){
                    let a = code.appendChild(document.createElement("a"));
                    a.setAttribute("href", url.encodedString);
                    a.appendChild(document.createTextNode(arg.type));
                }else{
                    code.appendChild(document.createTextNode(arg.type));
                }
                if (arg.nullable){
                    code.appendChild(document.createTextNode('?'));
                }
            }
        }
        if (arg.summary){
            let markdown = resolver.createMarkdownWithString(arg.summary);
            let children = markdown.htmlElementsForDocument(document);
            for (let i = 0, l = children.length; i < l; ++i){
                dd.appendChild(children[i]);
            }
        }
    },

    declarationCode: function(){
        var args = this.argumentStrings();
        if (this.name){
            return ["function %s(%s)".sprintf(this.name, args.join(', '))];
        }
        return ["function(%s)".sprintf(args.join(', '))];
    },

    argumentStrings: function(){
        var strings = [];
        for (let i = 0, l = this.arguments.length; i < l; ++i){
            let arg = this.arguments[i];
            if (arg.default){
                strings.push("%s=%s".sprintf(arg.name, arg.default));
            }else if (arg.variable){
                strings.push("%s...".sprintf(arg.name));
            }else{
                strings.push(arg.name);
            }
        }
        return strings;
    },

    // --------------------------------------------------------------------
    // MARK: - JSON

    jsonObject: function(baseURL){
        let obj = DocFunction.$super.jsonObject.call(this, baseURL);
        var args = this.argumentStrings();
        obj.name += '(%s)'.sprintf(args.join(", "));
        return obj;
    }

 });
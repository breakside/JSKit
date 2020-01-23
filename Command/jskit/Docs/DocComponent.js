// #import Foundation
// #import DOM
// #import "Markdown.js"
'use strict';

JSClass("DocComponent", JSObject, {

    // --------------------------------------------------------------------
    // MARK: - Creating and populating

    initWithKind: function(kind){
        var subclass = DocComponent.subclassesByKind[kind];
        if (!subclass){
            return null;
        }
        var instance = subclass.init();
        instance.children = [];
        instance.images = [];
        return instance;
    },

    extractPropertiesFromInfo: async function(info, documentation){
        if (info.prefix){
            this.uniquePrefix = info.prefix;
        }
        if (info.suffix){
            this.uniqueSuffix = info.suffix;
        }
        if (info.copyright){
            this.copyright = info.copyright;
        }
        if (info.beta){
            this.beta = info.beta;
        }
    },

    sourceURL: null,
    outputURL: JSDynamicProperty('_outputURL'),
    copyright: null,
    beta: false,

    setOutputURL: function(outputURL){
        this._outputURL = outputURL;
        let containerURL = this._outputURL.removingLastPathComponent();
        if (this.kind !== 'index'){
            containerURL = containerURL.appendingPathComponent(this.uniqueName, true);
        }
        for (let i = 0, l = this.children.length; i < l; ++i){
            let child = this.children[i];
            child.outputURL = containerURL.appendingPathComponent(child.uniqueName + '.html');
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Naming

    name: null,
    uniqueName: JSReadOnlyProperty(),
    uniquePrefix: null,
    uniqueSuffix: null,

    getUniqueName: function(){
        var str = "";
        if (this.uniquePrefix !== null){
            str += this.uniquePrefix + '-';
        }
        str += this.sanitizedString(this.getBaseName());
        if (this.uniqueSuffix !== null){
            str += '-' + this.uniqueSuffix;
        }
        return str;
    },

    getBaseName: function(){
        return this.name;
    },

    sanitizedString: function(str){
        return str.toLowerCase().replace(/\s/g, '-').replace(/[^\w\-]/g, '').replace(/\-+/g,'-').replace(/^\-/, '').replace(/\-$/, '');
    },

    displayNameForKind: JSReadOnlyProperty(),

    getDisplayNameForKind: function(){
        return null;
    },

    titleForDescriptionSection: JSReadOnlyProperty(),

    getTitleForDescriptionSection: function(){
        return "Discussion";
    },

    title: JSReadOnlyProperty(),

    getTitle: function(){
        return this.name;
    },

    // --------------------------------------------------------------------
    // MARK: - Basic info

    summary: null,
    description: null,
    note: null,
    important: null,

    // --------------------------------------------------------------------
    // MARK: - Relationships

    environment: null,
    introduced: null,
    deprecated: null,
    see: null,

    inheritedFramework: function(){
        var component = this.parent;
        while (component !== null && component.kind != 'framework'){
            component = component.parent;
        }
        return component;
    },

    inheritedIntroduced: function(){
        var component = this;
        while (component !== null && component.introduced === null){
            component = component.parent;
        }
        return component ? component.introduced : null;
    },

    inheritedEnvironment: function(){
        var component = this;
        while (component !== null && component.environment === null){
            component = component.parent;
        }
        return component ? component.environment : null;
    },

    inheritedCopyright: function(){
        var component = this;
        while (component !== null && component.copyright === null){
            component = component.parent;
        }
        return component ? component.copyright : null;
    },

    // --------------------------------------------------------------------
    // MARK: - Relationships

    parent: null,
    children: null,
    images: null,

    // --------------------------------------------------------------------
    // MARK: - Generating HTML

    htmlDocument: function(documentation){
        var doctype = DOM.createDocumentType("html", "", "");
        var document = DOM.createDocument(null, "html", doctype);
        var html = document.documentElement;
        var head = html.appendChild(document.createElement("head"));
        var meta = head.appendChild(document.createElement("meta"));
        meta.setAttribute("charset", "utf-8");
        var title = head.appendChild(document.createElement("title"));
        var titleText = this.title;
        if (documentation.title){
            titleText = "%s | %s".sprintf(titleText, documentation.title);
        }
        title.appendChild(document.createTextNode(titleText));
        if (documentation.stylesheetURL){
            let link = head.appendChild(document.createElement("link"));
            link.setAttribute("rel", "stylesheet");
            link.setAttribute("type", "text/css");
            link.setAttribute("href", documentation.stylesheetURL.encodedStringRelativeTo(this.outputURL));
        }
        var body = html.appendChild(document.createElement("body"));
        var content = body.appendChild(document.createElement("article"));
        content.setAttribute("class", "doc " + this.kind);
        var elements = this.htmlArticleElements(document);

        if (this.see){
            let section = document.createElement('section');
            section.setAttribute('class', 'see');
            let header = document.createElement('header');
            let h1 = header.appendChild(document.createElement("h1"));
            h1.appendChild(document.createTextNode('See Also'));
            let p = document.createElement('p');
            section.appendChild(header);
            section.appendChild(p);
            elements.push(section);
            for (let i = 0, l = this.see.length; i < l; ++i){
                let name = this.see[i];
                let code = document.createElement('code');
                let url = this.urlForCode(name);
                if (url){
                    let a = document.createElement('a');
                    a.setAttribute('href', url.encodedString);
                    a.appendChild(document.createTextNode(name));
                    code.appendChild(a);
                }else{
                    code.appendChild(document.createTextNode(name));
                }
                p.appendChild(code);
                if (i < l - 1){
                    p.appendChild(document.createTextNode(', '));
                }
            }
        }

        var copyright = this.inheritedCopyright();
        if (copyright){
            elements.push(this.footerElement(document, copyright));
        }

        var aside = null;
        for (let i = 0, l = elements.length; i < l; ++i){
            let element = elements[i];
            content.appendChild(element);
            if (element.tagName == 'aside' && element.getAttribute('class') == 'availability'){
                aside = element;
                aside.setAttribute('style', 'grid-row-end: %d;'.sprintf(i + 1));
            }
        }

        if (aside !== null){
            var outline = this.outlineElements(elements);
            if (outline.length > 1){
                let title = document.createElement('header');
                title.appendChild(document.createTextNode('On This Page'));
                title.setAttribute('class', 'outline');
                aside.appendChild(title);
                let ul = aside.appendChild(document.createElement('ul'));
                ul.setAttribute('class', 'outline');
                let listStack = [ul];
                for (let i = 0, l = outline.length; i < l; ++i){
                    let element = outline[i];
                    let level = parseInt(element.getAttribute("outline-level"));
                    if (level > listStack.length){
                        listStack.push(ul);
                        ul = ul.childNodes[ul.childNodes.length - 1].appendChild(document.createElement('ul'));
                    }else if (level < listStack.length){
                        while (level < listStack.length){
                            ul = listStack.pop();
                        }
                    }
                    element.removeAttribute("outline-level");
                    let title = element.childNodes[0].data;
                    let id = this.sanitizedString(title);
                    element.setAttribute("id", id);
                    let li = ul.appendChild(document.createElement('li'));
                    let a = li.appendChild(document.createElement('a'));
                    a.appendChild(document.createTextNode(title));
                    a.setAttribute("href", "#%s".sprintf(id));
                }
            }
            if (aside.childNodes.length === 0){
                aside.parentNode.removeChild(aside);
            }
        }
        return document;
    },

    outlineElements: function(elements){
        var stack = JSCopy(elements);
        var outline = [];
        while (stack.length > 0){
            let element = stack.shift();
            if (element.nodeType === DOM.Node.ELEMENT_NODE){
                let level = element.getAttribute("outline-level");
                if (level !== null){
                    outline.push(element);
                }
                for (let i = element.childNodes.length - 1; i >= 0; --i){
                    let node = element.childNodes[i];
                    stack.unshift(node);
                }   
            }
        }
        return outline;
    },

    footerElement: function(document, copyright){
        var footer = document.createElement('footer');
        var p = footer.appendChild(document.createElement('p'));
        p.appendChild(document.createTextNode(copyright));
        return footer;
    },

    htmlArticleElements: function(document){
        var elements = [];

        var header = document.createElement("header");
        elements.push(header);
        var h1 = header.appendChild(document.createElement("h1"));
        h1.appendChild(document.createTextNode(this.title));
        if (this.summary){
            let markdown = this.createMarkdownWithString(this.summary);
            let children = markdown.htmlElementsForDocument(document);
            for (let i = 0, l = children.length; i < l; ++i){
                header.appendChild(children[i]);
            }
        }
        if (this.displayNameForKind){
            let p = header.appendChild(document.createElement('p'));
            p.setAttribute("class", "type");
            p.appendChild(document.createTextNode(this.displayNameForKind));
        }

        if (this.description){
            let description = document.createElement("section");
            elements.push(description);
            description.setAttribute("class", "description");
            let markdown = this.createMarkdownWithString(this.description);
            let children = markdown.htmlElementsForDocument(document);
            if (children.length === 0 || children[0].tagName != markdown.htmlOptions.firstLevelHeaderTagName){
                let h1 = description.appendChild(document.createElement("h1"));
                h1.appendChild(document.createTextNode(this.titleForDescriptionSection));
                h1.setAttribute("outline-level", "1");
            }
            for (let i = 0, l = children.length; i < l; ++i){
                let child = children[i];
                if (child.tagName == markdown.htmlOptions.firstLevelHeaderTagName){
                    child.setAttribute("outline-level", "1");
                }else if (child.tagName == markdown.htmlOptions.secondLevelHeaderTagName){
                    child.setAttribute("outline-level", "2");
                }
                description.appendChild(child);
            }
        }

        if (this.note){
            let note = document.createElement("section");
            elements.push(note);
            note.setAttribute("class", "note");
            let header = note.appendChild(document.createElement("header"));
            let p = header.appendChild(document.createElement("p"));
            p.appendChild(document.createTextNode("Note:"));
            let div = note.appendChild(document.createElement("div"));
            let markdown = this.createMarkdownWithString(this.note);
            let children = markdown.htmlElementsForDocument(document);
            for (let i = 0, l = children.length; i < l; ++i){
                div.appendChild(children[i]);
            }
        }

        if (this.important){
            let important = document.createElement("section");
            elements.push(important);
            important.setAttribute("class", "important");
            let header = important.appendChild(document.createElement("header"));
            let p = header.appendChild(document.createElement("p"));
            p.appendChild(document.createTextNode("Important:"));
            let div = important.appendChild(document.createElement("div"));
            let markdown = this.createMarkdownWithString(this.important);
            let children = markdown.htmlElementsForDocument(document);
            for (let i = 0, l = children.length; i < l; ++i){
                div.appendChild(children[i]);
            }
        }

        let aside = document.createElement("aside");
        aside.setAttribute("class", "availability");
        elements.push(aside);

        if (this.kind != 'document' && this.kind != 'index'){
            var environment = this.inheritedEnvironment();
            var framework = this.inheritedFramework();
            var introduced = this.inheritedIntroduced();

            let title = document.createElement('header');
            title.appendChild(document.createTextNode('Environments'));
            aside.appendChild(title);
            let table = document.createElement('table');
            table.setAttribute('class', 'environments');
            let tbody = document.createElement('tbody');
            table.appendChild(tbody);
            aside.appendChild(table);
            let env;
            for (let i = 0, l = DocComponent.Environments.length; i < l; ++i){
                let row = document.createElement('tr');
                tbody.appendChild(row);
                env = DocComponent.Environments[i];
                let cell = document.createElement('td');
                cell.setAttribute('class', 'name');
                row.appendChild(cell);
                cell.appendChild(document.createTextNode(env.name));
                cell = document.createElement('td');
                row.appendChild(cell);
                let div = document.createElement('div');
                cell.appendChild(div);
                if (environment && env.id != environment){
                    div.appendChild(document.createTextNode('unavailable'));
                    cell.setAttribute('class', 'status unavailable');
                }else{
                    if (this.deprecated){
                        div.appendChild(document.createTextNode('deprecated'));
                        cell.setAttribute('class', 'status deprecated');
                    }else{
                        div.appendChild(document.createTextNode('available'));
                        cell.setAttribute('class', 'status available');
                    }
                }
            }

            if (framework){
                title = document.createElement('header');
                title.appendChild(document.createTextNode('Framework'));
                title.setAttribute('class', 'framework');
                aside.appendChild(title);
                let line = document.createElement('div');
                line.setAttribute('class', 'framework');
                line.appendChild(document.createTextNode(framework.name));
                aside.appendChild(line);

                if (introduced){
                    line = document.createElement('div');
                    line.setAttribute('class', 'versions');
                    line.appendChild(document.createTextNode(introduced));
                    if (this.deprecated){
                        line.appendChild(document.createTextNode('-'));
                        line.appendChild(document.createTextNode(this.deprecated));
                    }
                    aside.appendChild(line);
                }
            }
        }

        return elements;
    },

    codeSectionElement: function(document, title, lines){
        var section = document.createElement("section");
        var header = section.appendChild(document.createElement("header"));
        var h1 = header.appendChild(document.createElement("h1"));
        h1.appendChild(document.createTextNode(title));
        var code = section.appendChild(document.createElement("div"));
        code.setAttribute("class", "code");
        for (let i = 0, l = lines.length; i < l; ++i){
            let line = lines[i];
            if (line instanceof DOM.Element){
                code.appendChild(line);
            }else{
                let lineElement = code.appendChild(document.createElement("div"));
                lineElement.appendChild(document.createTextNode(line));
                lineElement.setAttribute("class", "line");
            }
        }
        return section;
    },

    codeLineFromTokens: function(document, tokens){
        let line = document.createElement("div");
        line.setAttribute("class", "line");
        for (let i = 0, l = tokens.length; i < l; ++i){
            let token = tokens[i];
            let span = null;
            if (token.link){
                let url = this.urlForCode(token.value);
                if (url !== null){
                    span = line.appendChild(document.createElement('a'));
                    span.setAttribute("href", url.encodedString);
                }
            }
            if (span === null){
                span = line.appendChild(document.createElement('span'));
            }
            span.appendChild(document.createTextNode(token.value));
            if (token.className){
                span.setAttribute("class", token.className);
            }
            if (i < l - 1 && tokens[i + 1].value != ','){
                line.appendChild(document.createTextNode(' '));
            }
        }
        return line;
    },

    output: async function(documentation){
        let document = this.htmlDocument(documentation);
        let indexURL = this.outputURL;
        let serializer = new XMLSerializer();
        let html = serializer.serializeToString(document);
        await documentation.fileManager.createFileAtURL(indexURL, html.utf8());

        for (let i = 0, l = this.images.length; i < l; ++i){
            let image = this.images[i];
            let sourceURL = JSURL.initWithString(image, this.sourceURL);
            let destinationURL = JSURL.initWithString(image, indexURL);
            await documentation.fileManager.copyItemAtURL(sourceURL, destinationURL);
        }
    },

    // --------------------------------------------------------------------
    // MARK: - URL resolving

    urlForMarkdownCode: function(markdown, code){
        return this.urlForCode(code);
    },

    urlForMarkdownLink: function(markdown, link){
        if (link.isAbsolute){
            return JSURL.initWithString(link);
        }
        let sourceURL = JSURL.initWithString(link + '.doc.yaml', this.sourceURL).standardized();
        let component = this.componentForSourceURL(sourceURL);
        if (component){
            return this.urlForComponent(component);
        }
        let url = this.urlForName(link);
        if (url){
            return url;
        }
        return JSURL.initWithString(link);
    },

    urlForMarkdownImage: function(markdown, image){
        this.images.push(image);
        return JSURL.initWithString(image);
    },

    urlForCode: function(code){
        var name = this.nameExcludingCodeSuffixes(code);
        var parts = name.split('.');
        var component = this.componentForName(parts.shift());
        while (parts.length > 0 && component !== null){
            component = component.childForName(parts.shift());
        }
        return this.urlForComponent(component);
    },

    nameExcludingCodeSuffixes: function(name){
        var bracketIndex = name.indexOf('[');
        if (bracketIndex > 0){
            name = name.substr(0, bracketIndex);
        }
        var parenIndex = name.indexOf('(');
        if (parenIndex > 0){
            name = name.substr(0, parenIndex);
        }
        if (name.endsWith('?')){
            name = name.substr(0, name.length - 1);
        }
        return name;
    },

    urlForName: function(name){
        var component = this.componentForName(name);
        return this.urlForComponent(component);
    },

    urlForComponent: function(component){
        if (component === null || component === this){
            return null;
        }
        var relative = component.outputURL.removingFileExtension().encodedStringRelativeTo(this.outputURL);
        return JSURL.initWithString(relative);
    },

    childForName: function(name, excludingChild){
        var candidates = [];
        for (let i = 0, l = this.children.length; i < l; ++i){
            let child = this.children[i];
            if (child !== excludingChild){
                if (child.uniqueName === name){
                    return child;
                }
                if (child.name == name){
                    candidates.push(child);
                }
            }
        }
        if (candidates.length > 0){
            return candidates[0];
        }
        return null;
    },

    descendantForName: function(name, excludingChild){
        // Immediate Children
        var component = this.childForName(name, excludingChild);
        if (component !== null){
            return component;
        }

        // Grandchildren or greater
        for (let i = 0, l = this.children.length; i < l && component === null; ++i){
            let child = this.children[i];
            if (child !== excludingChild){
                component = child.descendantForName(name);
            }
        }
        return component;
    },

    componentForName: function(name, excludingChild){
        // Self
        if (this.name == name){
            return this;
        }

        // Inherited
        var component = this.inhertitedComponentForName(name);
        if (component !== null){
            return component;
        }

        // Descendants
        component = this.descendantForName(name, excludingChild);
        if (component !== null){
            return component;
        }

        // Parent
        if (this.parent){
            return this.parent.componentForName(name, this);
        }

        return null;
    },

    inhertitedComponentForName: function(name){
        return null;
    },

    componentForSourceURL: function(sourceURL){
        if (this.parent !== null){
            return this.parent.componentForSourceURL(sourceURL);
        }
        return this._componentForSourceURL(sourceURL);
    },

    _componentForSourceURL: function(sourceURL){
        if (this.sourceURL && this.sourceURL.isEqual(sourceURL)){
            return this;
        }
        for (let i = 0, l = this.children.length; i < l; ++i){
            let child = this.children[i];
            let component = child._componentForSourceURL(sourceURL);
            if (component !== null){
                return component;
            }
        }
        return null;
    },

    variations: function(){
        var siblings = this.parent.children;
        var variations = [];
        for (let i = 0, l = siblings.length; i < l; ++i){
            let sibling = siblings[i];
            if (sibling !== this && sibling.name === this.name){
                variations.push(sibling);
            }
        }
        return variations;
    },

    // --------------------------------------------------------------------
    // MARK: - Markdown

    createMarkdownWithString: function(string){
        let markdown = Markdown.initWithString(string);
        markdown.delegate = this;
        return markdown;
    },

    // --------------------------------------------------------------------
    // MARK: - JSON

    jsonObject: function(baseURL){
        let url = this.outputURL.removingFileExtension();
        let obj = {
            name: this.name,
            kind: this.kind,
            title: this.title,
            url: url.encodedStringRelativeTo(baseURL)
        };
        if (this.beta){
            obj.beta = true;
        }
        return obj;
    }


});

DocComponent.Environments = [{id: 'html', name: 'HTML'}, {id: 'node', name: 'Node'}];

DocComponent.subclassesByKind = {};

DocComponent.$extend = function(extensions, name){
    var subclass = JSObject.$extend.call(this, extensions, name);
    if (subclass.prototype.kind){
        DocComponent.subclassesByKind[subclass.prototype.kind] = subclass;
    }
    return subclass;
};
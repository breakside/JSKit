// #import Foundation
// #import DOM
// #import "Markdown.js"
/* global JSClass, JSObject, JSDynamicProperty, JSReadOnlyProperty, DocComponent, DOM, Markdown, JSURL, XMLSerializer */
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
        return instance;
    },

    extractPropertiesFromInfo: async function(info, documentation){
    },

    sourceURL: null,
    outputURL: JSDynamicProperty('_outputURL'),

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

    getUniqueName: function(){
        return this.name.toLowerCase().replace(/\s/g, '-').replace(/[^\w\-]/g, '').replace(/\-+/g,'-');
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

    parent: null,
    children: null,

    // --------------------------------------------------------------------
    // MARK: - Generating HTML

    htmlDocument: function(documentation){
        var doctype = DOM.createDocumentType("html", "", "");
        var document = DOM.createDocument(null, "html", doctype);
        var html = document.documentElement;
        var head = html.appendChild(document.createElement("head"));
        var meta = head.appendChild(document.createElement("meta"));
        meta.setAttribute("content", "text/html; charset=utf-8");
        meta.setAttribute("http-equiv", "Content-Type");
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
        for (let i = 0, l = elements.length; i < l; ++i){
            content.appendChild(elements[i]);
        }
        return document;
    },

    htmlArticleElements: function(document){
        var elements = [];

        var header = document.createElement("header");
        elements.push(header);
        var h1 = header.appendChild(document.createElement("h1"));
        h1.appendChild(document.createTextNode(this.name));
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
            }
            for (let i = 0, l = children.length; i < l; ++i){
                description.appendChild(children[i]);
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
            let lineElement = code.appendChild(document.createElement("div"));
            lineElement.appendChild(document.createTextNode(lines[i]));
            lineElement.setAttribute("class", "line");
        }
        return section;
    },

    output: async function(documentation){
        let document = this.htmlDocument(documentation);
        let indexURL = this.outputURL;
        let serializer = new XMLSerializer();
        let html = serializer.serializeToString(document);
        await documentation.fileManager.createFileAtURL(indexURL, html.utf8());

        // TODO: copy images as needed
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
        // TODO: track images so they can be copied
        return JSURL.initWithString(image);
    },

    urlForCode: function(code){
        var name = code;
        var parenIndex = name.indexOf('(');
        if (parenIndex > 0){
            name = name.substr(0, parenIndex);
        }
        var parts = code.split('.');
        var component = this.componentForName(parts.shift());
        while (parts.length > 0 && component !== null){
            component = component.childForName(parts.shift());
        }
        return this.urlForComponent(component);
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
        for (let i = 0, l = this.children.length; i < l; ++i){
            let child = this.children[i];
            if (child !== excludingChild && child.name == name){
                return child;
            }
        }
        return null;
    },

    descendantForName: function(name, excludingChild){
        let component = null;
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

        // Immediate Children
        var component = this.childForName(name, excludingChild);
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
        return {
            name: this.name,
            kind: this.kind,
            title: this.title,
            url: url.encodedStringRelativeTo(baseURL)
        };
    }


});

DocComponent.subclassesByKind = {};

DocComponent.$extend = function(extensions, name){
    var subclass = JSObject.$extend.call(this, extensions, name);
    if (subclass.prototype.kind){
        DocComponent.subclassesByKind[subclass.prototype.kind] = subclass;
    }
    return subclass;
};
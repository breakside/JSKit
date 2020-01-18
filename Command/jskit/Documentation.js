// #import Foundation
// #import jsyaml
// #import "Markdown.js"
// #import "DocComponent.js"
// #import "DocIndex.js"
// #import "DocFramework.js"
// #import "DocClass.js"
// #import "DocProtocol.js"
// #import "DocMethod.js"
// #import "DocInit.js"
// #import "DocConstructor.js"
// #import "DocProperty.js"
// #import "DocEnum.js"
// #import "DocEnumOption.js"
// #import "DocEnumFunction.js"
// #import "DocDocument.js"
// #import "DocSpec.js"
// #import "DocSpecProperty.js"
// #import "DocCommandLine.js"
// #import "DocCommandArgument.js"
// #import "DocDictionary.js"
// #import "DocDictionaryProperty.js"
/* global JSClass, JSObject, JSCopy, jsyaml, JSURL, DocComponent, JSBundle */
'use strict';

JSClass("Documentation", JSObject, {

    initWithRootURL: function(rootURL, fileManager){
        this.rootURL = rootURL.standardized();
        this.fileManager = fileManager;
    },

    stylesheetURL: null,
    rootURL: null,
    outputDirectoryURL: null,
    wwwURL: null,
    documents: null,
    fileManager: null,
    printer: null,
    title: null,

    run: async function(){
        this.wwwURL = this.outputDirectoryURL.appendingPathComponents(['www', 'docs'], true);
        let exists = await this.fileManager.itemExistsAtURL(this.wwwURL);
        if (exists){
            await this.fileManager.removeItemAtURL(this.wwwURL);
        }
        await this.copyStyles();
        let rootComponent = await this.loadSource(this.rootURL);
        rootComponent.outputURL = this.wwwURL.appendingPathComponent('index.html');
        await this.output([rootComponent]);
        await this.outputComponentsJSON(rootComponent);
        await this.outputManifestConfig(rootComponent);
    },

    copyStyles: async function(){
        var stylesURL = this.wwwURL.appendingPathComponent('_style', true);
        var metadata = JSBundle.mainBundle.metadataForResourceName('doc-default', 'css');
        var contents = await JSBundle.mainBundle.getResourceData(metadata);
        this.stylesheetURL = stylesURL.appendingPathComponent('default.css');
        await this.fileManager.createFileAtURL(this.stylesheetURL, contents);
    },

    loadSource: async function(url){
        this.printer.setStatus("Reading %s...".sprintf(url.lastPathComponent));
        let exists = await this.fileManager.itemExistsAtURL(url);
        if (!exists){
            return null;
        }
        let contents = await this.fileManager.contentsAtURL(url);
        let yaml = contents.stringByDecodingUTF8();
        let info = jsyaml.safeLoad(yaml);
        if (!info.name){
            let name = url.lastPathComponent;
            info.name = name.substr(0, name.length - '.doc.yaml'.length);
        }
        let component = await this.createComponentFromInfo(info, url);
        component.sourceURL = url;
        return component;
    },

    createComponentFromInfo: async function(info, baseURL, defaultKind){
        if (typeof(info) === 'string'){
            let url = JSURL.initWithString(info + '.doc.yaml', baseURL);
            url.standardize();
            let component = await this.loadSource(url);
            return component;
        }
        let component = DocComponent.initWithKind(info.kind || defaultKind);
        if (component === null){
            throw new Error("Could not create component for %s".sprintf(info.name ? info.name : JSON.stringify(info)));
        }
        if (info.name){
            component.name = info.name;
        }
        if (info.summary){
            component.summary = info.summary;
        }
        if (info.note){
            component.note = info.note;
        }
        if (info.important){
            component.important = info.important;
        }
        if (info.environment){
            component.environment = info.environment;
        }
        if (info.introduced){
            component.introduced = info.introduced;
        }
        if (info.deprecated){
            component.deprecated = info.deprecated;
        }
        if (info.see){
            component.see = info.see;
        }
        if (info.description){
            if (info.description.length < 64 && info.description.endsWith('.md')){
                let mdURL = JSURL.initWithString(info.description, baseURL);
                let contents = await this.fileManager.contentsAtURL(mdURL);
                component.description = contents.stringByDecodingUTF8();
            }else{
                component.description = info.description;
            }
        }
        component.sourceURL = baseURL;
        await component.extractPropertiesFromInfo(info, this);
        return component;
    },

    output: async function(components){
        for (let i = 0, l = components.length; i < l; ++i){
            let component = components[i];
            this.printer.setStatus("Generating docs for %s...".sprintf(component.name));
            let componentURL = await component.output(this);
            await this.output(component.children);
        }
    },

    outputComponentsJSON: async function(rootComponent){
        var baseURL = this.wwwURL;
        var obj = rootComponent.jsonObject(baseURL);
        var json = JSON.stringify({components: [obj]}, null, 2);
        var url = this.outputDirectoryURL.appendingPathComponent('components.json');
        await this.fileManager.createFileAtURL(url, json.utf8());
    },

    outputManifestConfig: async function(rootComponent){
        var config = {};
        let baseURL = this.wwwURL.removingLastPathComponent();
        var stack = [rootComponent];
        while (stack.length > 0){
            let component = stack.shift();
            let url = component.outputURL;
            let path = url.encodedStringRelativeTo(baseURL);
            config[path] = {
                required: false,
                path: path.substr(0, path.length - path.fileExtension.length)
            };
            for (let i = 0, l = component.children.length; i < l; ++i){
                stack.push(component.children[i]);
            }
        }
        var json = JSON.stringify(config, null, 2);
        var url = this.outputDirectoryURL.appendingPathComponent('components-manifest.json');
        await this.fileManager.createFileAtURL(url, json.utf8());
    }

});
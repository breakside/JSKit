// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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

    sublime: async function(){
        let rootComponent = await this.loadSource(this.rootURL);
        var classes = [];
        var properties = [];
        var methods = [];
        var functions = [];
        var enums = [];
        var blacklist = new Set(["FNTAdobeNamesToUnicode"]);
        var visit = function(component){
            if (!blacklist.has(component.name)){
                this.printer.setStatus("Scanning %s...".sprintf(component.name));
                if (component.kind == 'class'){
                    this.addSublimeCompletionsForClass(classes, component);
                // }else if (component.kind == 'property'){
                //     this.addSublimeCompletionsForProperty(properties, component);
                // }else if (component.kind == 'method'){
                //     this.addSublimeCompletionsForMethod(methods, component);
                }else if (component.kind == 'function'){
                    this.addSublimeCompletionsForFunction(functions, component);
                }else if (component.kind == 'enum'){
                    this.addSublimeCompletionsForEnum(enums, component);
                }
                if (component.children){
                    for (var i = 0, l = component.children.length; i < l; ++i){
                        visit.call(this, component.children[i]);
                    }
                }
            }
        };
        let prefix = rootComponent.name.toLowerCase();
        let url;
        visit.call(this, rootComponent);
        if (classes.length > 0){
            url = this.outputDirectoryURL.appendingPathComponent("%s-classes.sublime-completions".sprintf(prefix));
            this.printer.setStatus("Writing %s...".sprintf(url.lastPathComponent));
            await this.outputSublimeCompletions(url, 'source.js - comment - string', classes);
        }
        if (properties.length > 0){
            url = this.outputDirectoryURL.appendingPathComponent("%s-properties.sublime-completions".sprintf(prefix));
            this.printer.setStatus("Writing %s...".sprintf(url.lastPathComponent));
            await this.outputSublimeCompletions(url, 'source.js meta.property.object.js', properties);
        }
        if (methods.length > 0){
            url = this.outputDirectoryURL.appendingPathComponent("%s-methods.sublime-completions".sprintf(prefix));
            this.printer.setStatus("Writing %s...".sprintf(url.lastPathComponent));
            await this.outputSublimeCompletions(url, 'source.js meta.property.object.js', methods);
        }
        if (functions.length > 0){
            url = this.outputDirectoryURL.appendingPathComponent("%s-functions.sublime-completions".sprintf(prefix));
            this.printer.setStatus("Writing %s...".sprintf(url.lastPathComponent));
            await this.outputSublimeCompletions(url, 'source.js - comment - string', functions);
        }
        if (enums.length > 0){
            url = this.outputDirectoryURL.appendingPathComponent("%s-enums.sublime-completions".sprintf(prefix));
            this.printer.setStatus("Writing %s...".sprintf(url.lastPathComponent));
            await this.outputSublimeCompletions(url, 'source.js - comment - string', enums);
        }
    },

    addSublimeCompletionsForClass: function(completions, component){
        completions.push({trigger: component.name, contents: component.name});
        for (let i = 0, l = component.children.length; i < l; ++i){
            let child = component.children[i];
            if (child.kind == 'constructor'){
                completions.push({trigger: "%s\t%s".sprintf(component.name, child.getTitleWithoutParent()), contents: "%s(%s)".sprintf(component.name, this.sublimeArgumentsForComponent(child, 1))});
            // }else if (child.kind == 'init'){
            //     completions.push({trigger: "%s.%s".sprintf(component.name, child.name), contents: "%s.%s(%s)".sprintf(component.name, child.name, this.sublimeArgumentsForComponent(child, 1))});
            }
        }
    },

    addSublimeCompletionsForProperty: function(completions, component){
        completions.push({trigger: "%s\t%s".sprintf(component.name, component.parent.name), contents: component.name});
    },

    addSublimeCompletionsForMethod: function(completions, component){
        if (component.suffix){
            completions.push({trigger: "%s\t%s (%s)".sprintf(component.name, component.parent.name, component.suffix), contents: "%s(%s)".sprintf(component.name, this.sublimeArgumentsForComponent(component, 1))});
        }else{
            completions.push({trigger: "%s\t%s".sprintf(component.name, component.parent.name), contents: "%s(%s)".sprintf(component.name, this.sublimeArgumentsForComponent(component, 1))});
        }
    },

    addSublimeCompletionsForFunction: function(completions, component){
        completions.push({trigger: component.name, contents: "%s(%s)".sprintf(component.name, this.sublimeArgumentsForComponent(component, 1))});
    },

    addSublimeCompletionsForEnum: function(completions, component){
        let name = component.name;
        if (component.parent && (component.parent.kind == 'class' || component.parent.kind == 'protocol')){
            name = "%s.%s".sprintf(component.parent.name, name);
        }
        for (let i = 0, l = component.children.length; i < l; ++i){
            let option = component.children[i];
            let optionName = "%s.%s".sprintf(name, option.name);
            if (option.kind == 'enumoption'){
                completions.push({trigger: "%s\t%s".sprintf(option.name, name), contents: optionName});
            }else if (option.kind == 'enumfunction'){
                completions.push({trigger: "%s\t%s".sprintf(option.name, name), contents: "%s(%s)".sprintf(optionName, this.sublimeArgumentsForComponent(option, 1))});
            }
        }
    },

    sublimeArgumentsForComponent: function(component, n){
        let variables = [];
        for (let i = 0, l = component.arguments.length; i < l; ++i){
            let arg = component.arguments[i];
            if (!arg.default){
                if (arg.variable){
                    variables.push('${%d:%s...}'.sprintf(n++, arg.name));
                }else{
                    variables.push('${%d:%s}'.sprintf(n++, arg.name));
                }
            }
        }
        return variables.join(', ');
    },

    outputSublimeCompletions: async function(url, scope, completions){
        let payload = {
            scope: scope,
            completions: completions
        };
        let json = JSON.stringify(payload, null, 2);
        await this.fileManager.createFileAtURL(url, json.utf8());
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
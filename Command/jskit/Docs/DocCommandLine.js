// #import "DocTopicBasedComponent.js"
'use strict';

 JSClass("DocCommandLine", DocTopicBasedComponent, {

    kind: 'command',
    defaultChildKind: 'argv',

    // --------------------------------------------------------------------
    // MARK: - Creating and populating

    extractPropertiesFromInfo: async function(info, documentation){
        await DocCommandLine.$super.extractPropertiesFromInfo.call(this, info, documentation);
        if (info.invocations){
            this.invocations = info.invocations;
        }
    },
    
    invocations: null,

    // --------------------------------------------------------------------
    // MARK: - Naming

    getDisplayNameForKind: function(){
        return 'Command Line Utility';
    },

    // --------------------------------------------------------------------
    // MARK: - Generating HTML

    htmlArticleElements: function(document){
        var elements = DocCommandLine.$super.htmlArticleElements.call(this, document);
        var declaration = this.codeSectionElement(document, "Invocation", this.invocationLines());
        declaration.setAttribute("class", "invocation");
        elements.splice(1, 0, declaration);
        return elements;
    },

    invocationLines: function(){
        var commands = [];
        var component = this;
        while (component !== null && component.kind == 'command'){
            commands.unshift(component.name);
            component = component.parent;
        }
        commands.unshift('npx');
        commands.unshift('$');
        var command = commands.join(' ');
        var lines = [];
        if (this.invocations){
            for (var i = 0, l = this.invocations.length; i < l; ++i){
                lines.push("%s %s".sprintf(command, this.invocations[i]));
            }
        }else{
            lines.push(command);
        }
        return lines;
    }

 });
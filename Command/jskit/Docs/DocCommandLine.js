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
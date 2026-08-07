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

JSClass("DocFramework", DocTopicBasedComponent, {

    kind: 'framework',
    dependencies: null,

    getDisplayNameForKind: function(){
        return "Framework";
    },

    extractPropertiesFromInfo: async function(info, documentation){
        await DocFramework.$super.extractPropertiesFromInfo.call(this, info, documentation);
        if (info.dependencies){
            this.dependencies = info.dependencies;
        }
    },

    resolvedDependencies: function(){
        let dependencies = [];
        let dependencySet = new Set();
        if (this.dependencies !== null){
            for (let dependency of this.dependencies){
                let framework = this.componentForName(dependency);
                if (framework === null || framework.sourcePackage === null){
                    if (framework !== null && framework.kind === "framework"){
                        for (let indirectDependency of framework.resolvedDependencies()){
                            if (!dependencySet.has(indirectDependency)){
                                dependencySet.add(indirectDependency);
                                dependencies.push(indirectDependency);
                            }
                        }
                    }
                    if (!dependencySet.has(dependency)){
                        dependencySet.add(dependency);
                        dependencies.push(dependency);
                    }
                }
            }
        }
        return dependencies;
    },

    typescriptDeclaration: function(){
        if (this.isTypescript){
            return null;
        }
        let declaration = "";
        let references = [];
        let dependencies = this.resolvedDependencies();
        for (let dependency of dependencies){
            references.push('/// <reference types="./%s" />'.sprintf(dependency));
        }
        if (references.length > 0){
            declaration += references.join("\n");
            declaration += "\n\n";
        }
        let declarations = [];
        let children = this.componentsInNamespace(this.name);
        for (let child of children){
            let childDeclarations = child.typescriptDeclaration();
            if (childDeclarations !== null){
                declarations.push(childDeclarations);
            }
        }
        declaration += declarations.join("\n\n");
        declaration += "\n";
        return declaration;
    },

 });

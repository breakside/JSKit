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

 JSClass("DocDictionary", DocTopicBasedComponent, {

    kind: 'dictionary',
    defaultChildKind: 'dictproperty',

    // --------------------------------------------------------------------
    // MARK: - Naming

    getDisplayNameForKind: function(){
        return 'Dictionary';
    },

    typescriptDeclaration: function(container = null){
        if (this.isTypescript){
            return null;
        }
        if (this.name.indexOf(" ") >= 0){
            return null;
        }
        let declaration = "";
        if (container === null){
            declaration = "declare ";
        }
        let valueTypesByName = {};
        let properties = [];
        for (let child of this.children){
            if (!valueTypesByName[child.name]){
                valueTypesByName[child.name] = child.valueType;
                properties.push(child);
            }else{
                if (child.valueType != valueTypesByName[child.name]){
                    valueTypesByName[child.name] += " | " + child.valueType;
                }
            }
        }
        declaration += "type %s = {\n".sprintf(this.name);
        for (let child of properties){
            let childDeclaration = child.typescriptDeclaration("type", valueTypesByName[child.name]);
            if (childDeclaration !== null){
                declaration += "  %s\n".sprintf(childDeclaration);
            }
        }
        declaration += "};";
        return declaration;
    }

 });
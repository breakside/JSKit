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

// #import "DocFunction.js"
'use strict';

 JSClass("DocMethod", DocFunction, {

    kind: 'method',
    isStatic: false,
    optional: false,

    getDisplayNameForKind: function(){
        if (this.isStatic){
            return "Class Method";
        }
        return "Instance Method";
    },

    extractPropertiesFromInfo: async function(info, documentation){
        await DocMethod.$super.extractPropertiesFromInfo.call(this, info, documentation);
        if (info.static){
            this.isStatic = true;
        }
        if (info.optional){
            this.optional = true;
        }
    },
    
    getTitle: function(){
        if (this.isStatic){
            if (this.parent.kind == "extension"){
                return "%s.%s".sprintf(this.parent.extends, this.name);    
            }
            return "%s.%s".sprintf(this.parent.name, this.name);
        }
        return this.name;
    },
    
    declarationCode: function(){
        var args = this.argumentStrings();
        if (this.isStatic){
            return ["static %s(%s)".sprintf(this.name, args.join(', '))];
        }
        return ["%s(%s)".sprintf(this.name, args.join(', '))];
    },

    // --------------------------------------------------------------------
    // MARK: - JSON

    jsonObject: function(baseURL){
        let obj = DocMethod.$super.jsonObject.call(this, baseURL);
        if (this.isStatic){
            obj.static = true;
        }
        return obj;
    },

    typescriptDeclaration: function(container = null){
        if (this.name[0] === "["){
            return null;
        }
        let returnType = this.typescriptValueType(this.valueType, this.nullable, this.promise);
        let args = this.typescriptAgumentsDeclaration();
        if (container === "class" || container === "type" || container === "interface"){
            let declaration = "";
            if (container === "class" && this.isStatic){
                declaration += "static ";
            }
            declaration += "%s%s(%s): %s;".sprintf(this.name, this.optional ? "?" : "", args, returnType);
            return declaration;
        }
        return "function %s(%s): %s;".sprintf(this.name, args, returnType);
    },

 });
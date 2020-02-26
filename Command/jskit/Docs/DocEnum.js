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
/* global DocEnumOptions, DocEnumFunction */
'use strict';

 JSClass("DocEnum", DocTopicBasedComponent, {

    kind: 'enum',
    options: null,
    valueType: null,
    defaultChildKind: "enumoption",

    extractPropertiesFromInfo: async function(info, documentation){
        await DocEnum.$super.extractPropertiesFromInfo.call(this, info, documentation);
        if (info.options){
            this.options = info.options;
        }else{
            this.options = [];
        }
        if (info.type){
            this.valueType = info.type;
        }
    },

    suffixForMember: function(member){
        if (member.isKindOfClass(DocEnumOption) && member.value !== null){
            return ": %s".sprintf(member.value);
        }
        if (member.isKindOfClass(DocEnumFunction)){
            var args = member.argumentStrings();
            return ": function(%s)".sprintf(args.join(', '));
        }
        return DocEnum.$super.suffixForMember.call(this, member);
    },

    nameForMember: function(member){
        return member.name;
    },

    getTitle: function(){
        return "%s.%s".sprintf(this.parent.name, this.name);
    },

    htmlArticleElements: function(document){
        var index = 1;
        var elements = DocEnum.$super.htmlArticleElements.call(this, document);
        var declaration = this.codeSectionElement(document, "Declaration", this.declarationCode());
        declaration.setAttribute("class", "declaration");
        elements.splice(index++, 0, declaration);
        return elements;
    },

    declarationCode: function(){
        if (this.parent && this.parent.kind == 'class' || this.parent.kind == 'protocol'){
            return ["%s.%s = { ... }".sprintf(this.parent.name, this.name)];
        }
        return ["%s = { ... }".sprintf(this.name)];
    },

    getDisplayNameForKind: function(){
        if (this.valueType){
            return "%s Enum".sprintf(this.valueType);
        }
        return 'Enum';
    }

 });
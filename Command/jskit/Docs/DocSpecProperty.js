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

// #import "DocComponent.js"
'use strict';

 JSClass("DocSpecProperty", DocComponent, {

    kind: 'specproperty',
    valueType: null,

    getDisplayNameForKind: function(){
        return "Spec Property";
    },

    extractPropertiesFromInfo: async function(info, documentation){
        await DocSpecProperty.$super.extractPropertiesFromInfo.call(this, info, documentation);
        if (info.type){
            this.valueType = info.type;
        }
    },

    htmlArticleElements: function(document){
        let index = 1;
        var elements = DocSpecProperty.$super.htmlArticleElements.call(this, document);

        if (this.valueType){
            let valueType = this.nameExcludingCodeSuffixes(this.valueType);
            let typeSection = document.createElement("section");
            elements.splice(index++, 0, typeSection);
            typeSection.setAttribute("class", "return");
            let header = typeSection.appendChild(document.createElement("header"));
            let h1 = header.appendChild(document.createElement("h1"));
            h1.appendChild(document.createTextNode("Resolved Value Type"));
            let p = typeSection.appendChild(document.createElement("p"));
            let code = p.appendChild(document.createElement("code"));
            let url = this.urlForCode(valueType + ".Spec File Properties");
            if (!url){
                url = this.urlForCode(valueType);
            }
            if (url){
                let a = code.appendChild(document.createElement("a"));
                a.setAttribute("href", url.encodedString);
                a.appendChild(document.createTextNode(this.valueType));
            }else{
                code.appendChild(document.createTextNode(this.valueType));
            }
        }

        var variations = this.variations();
        if (variations.length > 0){
            let section = document.createElement("section");
            section.setAttribute("class", "variations");
            elements.push(section);
            let header = section.appendChild(document.createElement("header"));
            let h1 = header.appendChild(document.createElement("h1"));
            h1.appendChild(document.createTextNode("Alternate Forms"));

            let ul = section.appendChild(document.createElement("ul"));

            for (let i = 0, l = variations.length; i < l; ++i){
                let variation = variations[i];
                let url = this.urlForComponent(variation);
                let li = ul.appendChild(document.createElement("li"));
                li.setAttribute("class", variation.kind);
                let a = document.createElement("a");
                a.setAttribute("href", url.encodedString);
                let code = li.appendChild(document.createElement('code'));
                code.appendChild(a);
                a.appendChild(document.createTextNode(variation.name));
                if (variation.valueType){
                    code.appendChild(document.createTextNode(": %s".sprintf(variation.valueType)));
                }
                if (variation.summary){
                    let markdown = this.createMarkdownWithString(variation.summary);
                    let children = markdown.htmlElementsForDocument(document);
                    for (let j = 0, k = children.length; j < k; ++j){
                        li.appendChild(children[j]);
                    }

                }
            }
        }

        return elements;
    },

 });
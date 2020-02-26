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

 JSClass("DocSpec", DocTopicBasedComponent, {

    kind: 'spec',
    defaultChildKind: 'specproperty',

    // --------------------------------------------------------------------
    // MARK: - Naming

    getDisplayNameForKind: function(){
        return 'Spec File Properties';
    },

    getTitle: function(){
        return "%s Spec File Properties".sprintf(this.parent.name);
    },

    getUniqueName: function(){
        return 'spec-file-properties';
    },

    htmlArticleElements: function(document){
        var elements = DocSpec.$super.htmlArticleElements.call(this, document);

        if (this.parent.inherits){
            var inheritedClass = this.componentForName(this.parent.inherits);
            var inheritedSpec = null;
            while (inheritedClass !== null && inheritedSpec === null){
                inheritedSpec = inheritedClass.childForName("Spec File Properties");
                if (inheritedClass.inherits){
                    inheritedClass = this.componentForName(inheritedClass.inherits);
                }else{
                    inheritedClass = null;
                }
            }
            if (inheritedSpec){
                var url = this.urlForComponent(inheritedSpec);
                if (url){
                    let inherits = document.createElement('section');
                    elements.push(inherits);
                    inherits.setAttribute("class", "inherits");
                    let header = inherits.appendChild(document.createElement("header"));
                    let h1 = header.appendChild(document.createElement("h1"));
                    h1.appendChild(document.createTextNode("Inherits From"));
                    let p = inherits.appendChild(document.createElement("p"));
                    let code = p.appendChild(document.createElement("code"));
                    let a = code.appendChild(document.createElement("a"));
                    a.setAttribute("href", url.encodedString);
                    a.appendChild(document.createTextNode(inheritedSpec.title));
                }
            }
        }

        return elements;
    },

    inhertitedComponentForName: function(name){
        let component = null;
        if (this.parent.inherits){
            var inherits = this.parent.parent.componentForName(this.parent.inherits, this);
            if (inherits !== null){
                let spec = inherits.childForName("Spec File Properties");
                if (spec !== null){
                    component = spec.childForName(name);
                }
                if (component === null){
                    component = inherits.childForName(name);
                }

            }
        }
        return component;
    },

 });
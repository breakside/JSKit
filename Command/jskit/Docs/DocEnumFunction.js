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
/* global JSClass, DocComponent, DocEnumFunction, DocFunction */
'use strict';

 JSClass("DocEnumFunction", DocFunction, {

    kind: 'enumfunction',

    getDisplayNameForKind: function(){
        return "Enum Function";
    },

    getTitle: function(){
        var title = "%s.%s".sprintf(this.parent.name, this.name);
        if (this.parent.parent && this.parent.parent.kind == 'class' || this.parent.parent.kind == 'protocol'){
            title = "%s.%s".sprintf(this.parent.parent.name, title);
        }
        return title;
    },

    declarationCode: function(){
        var args = this.argumentStrings();
        return ['%s: function(%s)'.sprintf(this.name, args.join(', '))];
    }

 });
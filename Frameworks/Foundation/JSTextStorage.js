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

// #import "JSAttributedString.js"
'use strict';

JSClass("JSTextStorage", JSAttributedString, {

    layoutManagers: JSReadOnlyProperty('_layoutManagers', null),

    initWithString: function(string, attributes){
        JSTextStorage.$super.initWithString.call(this, string, attributes);
        this._commonTextStorageInit();
    },

    initWithAttributedString: function(string){
        JSTextStorage.$super.initWithAttributedString.call(this, string);
        this._commonTextStorageInit();
    },

    _commonTextStorageInit: function(){
        this._layoutManagers = [];
    },

    addLayoutManager: function(manager){
        this._layoutManagers.push(manager);
        manager.textStorage = this;
    },

    removeLayoutManagerAtIndex: function(index){
        this._layoutManagers[index].textStorage = null;
        this._layoutManagers.splice(index, 1);
    },

    removeAllLayoutManagers: function(){
        for (var i = 0, l = this._layoutManagers.length; i < l; ++i){
            this._layoutManagers[i].textStorage = null;
        }
        this._layoutManagers = [];
    },

    replaceCharactersInRangeWithString: function(range, string){
        JSTextStorage.$super.replaceCharactersInRangeWithString.call(this, range, string);
        // $super will call replaceCharactersInRangeWithAttributedString, so we don't want to
        // double-notify
        // for (var i = 0, l = this._layoutManagers.length; i < l; ++i){
        //     this._layoutManagers[i].textStorageDidReplaceCharactersInRange(range, string.length);
        // }
    },

    replaceCharactersInRangeWithAttributedString: function(range, attributedString){
        if (attributedString === null){
            this.replaceCharactersInRangeWithString(range, "");
            return;
        }
        JSTextStorage.$super.replaceCharactersInRangeWithAttributedString.call(this, range, attributedString);
        for (var i = 0, l = this._layoutManagers.length; i < l; ++i){
            this._layoutManagers[i].textStorageDidReplaceCharactersInRange(range, attributedString.string.length);
        }
    },

    setAttributesInRange: function(attributes, range){
        JSTextStorage.$super.setAttributesInRange.call(this, attributes, range);
        for (var i = 0, l = this._layoutManagers.length; i < l; ++i){
            this._layoutManagers[i].textStorageDidChangeAttributesInRange(range);
        }
    },

    addAttributesInRange: function(attributes, range){
        JSTextStorage.$super.addAttributesInRange.call(this, attributes, range);
        for (var i = 0, l = this._layoutManagers.length; i < l; ++i){
            this._layoutManagers[i].textStorageDidChangeAttributesInRange(range);
        }
    },

    removeAttributesInRange: function(attributeNames, range){
        JSTextStorage.$super.removeAttributesInRange.call(this, attributeNames, range);
        for (var i = 0, l = this._layoutManagers.length; i < l; ++i){
            this._layoutManagers[i].textStorageDidChangeAttributesInRange(range);
        }
    }

});
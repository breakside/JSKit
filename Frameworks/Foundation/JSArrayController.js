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

// #import "JSObject.js"
'use strict';

JSClass('JSArrayController', JSObject, {

    arrangedObjects    : null,
    contentArray       : null,

    init: function(){
        this._arrangedObjects = [];
        this._contentArray = [];
    },

    // -----------------------------------------------------------------------------
    // MARK: - Source Data

    setContentArray: function(contentArray){
        this._contentArray = contentArray;
        // didChange arrangedObjects
    },

    insertObjectInContentArrayAtIndex: function(){
    },

    removeObjectFromContentArrayAtIndex: function(){
    },

    replaceObjectInContentArrayAtIndex: function(){
    },

    // -----------------------------------------------------------------------------
    // MARK: - Arranged Objects

    getArrangedObjects: function(){
    },

    setArrangedObjects: function(){
    },

    arrangeObjects: function(){
    },

    insertObjectInArrangedObjectsAtIndex: function(){
    },

    removeObjectFromArrangedObjectsAtIndex: function(){
    },

    replaceObjectInArrangedObjectsAtIndex: function(){
    },

    // -----------------------------------------------------------------------------
    // MARK: - Sort Descriptors


    setSortDescriptors: function(sortDescriptors){
    },

    getSortDescriptors: function(){
    },

    // -----------------------------------------------------------------------------
    // MARK: - Selection

    getSelectionIndex: function(){
    },

    setSelectionIndex: function(){
    },

    getSelectionIndexes: function(){
    },

    setSelectionIndexes: function(){
    },

    getSelectedObject: function(){
    },

    setSelectedObject: function(){
    },

    getSelectedObjects :function(){
    },

    setSelectedObjects: function(){
    },

    selectNext: function(){
    },

    selectPrevios: function(){
    },

    canSelectNext: function(){
    },

    canSelectPrevious: function(){
    }

    // -----------------------------------------------------------------------------
    // MARK: - Adding/Removing Objects
});

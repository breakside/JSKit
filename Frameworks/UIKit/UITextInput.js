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

// #import Foundation
'use strict';

JSProtocol('UITextInput', JSProtocol, {

    insertText: function(text){},
    insertNewline: function(){},
    insertLineBreak: function(){},
    insertTab: function(){},
    insertBacktab: function(){},

    deleteBackward: function(){},
    deleteWordBackward: function(){},
    deleteToBeginningOfLine: function(){},
    deleteToBeginningOfDocument: function(){},
    deleteForward: function(){},
    deleteWordForward: function(){},
    deleteToEndOfLine: function(){},
    deleteToEndOfDocument: function(){},
    deleteAll: function(){},
    
    moveBackward: function(){},
    moveWordBackward: function(){},
    moveToBeginningOfLine: function(){},
    moveUp: function(){},
    moveToBeginningOfDocument: function(){},
    moveForward: function(){},
    moveWordForward: function(){},
    moveToEndOfLine: function(){},
    moveDown: function(){},
    moveToEndOfDocument: function(){},
    
    moveBackwardAndModifySelection: function(){},
    moveWordBackwardAndModifySelection: function(){},
    moveToBeginningOfLineAndModifySelection: function(){},
    moveUpAndModifySelection: function(){},
    moveToBeginningOfDocumentAndModifySelection: function(){},
    moveForwardAndModifySelection: function(){},
    moveWordForwardAndModifySelection: function(){},
    moveToEndOfLineAndModifySelection: function(){},
    moveDownAndModifySelection: function(){},
    moveToEndOfDocumentAndModifySelection: function(){},
    selectAll: function(){},

    textInputLayer: function(){},
    textInputLayoutManager: function(){},
    textInputSelections: function(){}
    
});

UITextInput.SelectionInsertionPoint = {
    start: 0,
    end: 1
};

UITextInput.SelectionAffinity = {
    beforeCurrentCharacter: 0,
    afterPreviousCharacter: 1
};

JSGlobalObject.UITextInputSelection = function(range, insertionPoint, affinity){
    if (this === undefined){
        if (range === null){
            return null;
        }
        return new UITextInputSelection(range, insertionPoint, affinity);
    }else{
        if (range instanceof UITextInputSelection){
            this.range = JSRange(range.range);
            this.insertionPoint = range.insertionPoint;
            this.affinity = range.affinity;
        }else{
            if (insertionPoint === undefined){
                insertionPoint = UITextInput.SelectionInsertionPoint.end;
            }
            if (affinity === undefined){
                affinity = UITextInput.SelectionAffinity.beforeCurrentCharacter;
            }
            this.range = JSRange(range);
            this.insertionPoint = insertionPoint;
            this.affinity = affinity;
        }
    }
};

UITextInputSelection.prototype = {

    range: null,
    insertionPoint: null,
    affinity: null,

    containsIndex: function(index){
        return this.range.length > 0 && this.range.contains(index);
    },

};

Object.defineProperties(UITextInputSelection.prototype, {

    insertionLocation: {
        get: function UITextInputSelection_getInsertionIndex(){
            var location = this.range.location;
            if (this.insertionPoint === UITextInput.SelectionInsertionPoint.end){
                location += this.range.length;
            }
            return location;
        }
    }

});
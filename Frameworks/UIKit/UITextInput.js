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
    replaceText: function(selections, text){},
    insertNewline: function(){},
    insertLineBreak: function(){},
    insertTab: function(){},
    insertBacktab: function(){},

    setMarkedText: function(text){},
    clearMarkedText: function(){},
    markedTextRange: function(){},

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
    textInputSelections: function(){},

    keyboardType: null,
    autocapitalizationType: null,
    textContentType: null,
    secureTextEntry: false
    
});

UITextInput.SelectionInsertionPoint = {
    start: 0,
    end: 1
};

UITextInput.SelectionAffinity = {
    beforeCurrentCharacter: 0,
    afterPreviousCharacter: 1
};

UITextInput.TextContentType = {
    none: 0,
    url: 1,
    email: 2,
    phone: 3,
    username: 4,
    password: 5,
    newPassword: 6,
    oneTimeCode: 7,
    name: 8,
    namePrefix: 9,
    givenName: 10,
    middleName: 11,
    familyName: 12,
    nameSuffix: 13,
    nickname: 14,
    organizationName: 15,
    streetAddress: 16,
    streetAddressLine1: 17,
    streetAddressLine2: 18,
    city: 19,
    state: 20,
    locality: 21,
    country: 22,
    postalCode: 23
};

UITextInput.KeyboardType = {
    default: 0,
    url: 1,
    email: 2,
    phone: 3,
    number: 4,
    decimal: 5,
    search: 6
};

UITextInput.AutocapitalizationType = {
    none: 0,
    words: 1,
    sentences: 2,
    characters: 3
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
            this.attributes = JSCopy(range.attributes);
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
    attributes: null,

    containsIndex: function(index){
        return this.range.length > 0 && this.range.contains(index);
    },

    toString: function(){
        if (this.range.length === 0){
            return "@%d".sprintf(this.range.location);
        }
        if (this.insertionPoint === UITextInput.SelectionInsertionPoint.end){
            return "@%d->%d".sprintf(this.range.location, this.range.end);
        }
        return "@%d<-%d".sprintf(this.range.location, this.range.end);
    }

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
    },

    startLocation: {
        get: function UITextInputSelection_getStartLocation(){
            var location = this.range.location;
            if (this.insertionPoint === UITextInput.SelectionInsertionPoint.start){
                location += this.range.length;
            }
            return location;
        }
    }

});
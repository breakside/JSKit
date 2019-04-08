// #import Foundation
/* global JSProtocol */
'use strict';

JSProtocol('UITextInput', JSProtocol, {

    insertText: function(text){},
    insertNewline: function(){},
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
    selectAll: function(){}
    
});
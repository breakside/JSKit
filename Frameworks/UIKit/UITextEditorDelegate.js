// #import "Foundation/Foundation.js"
/* global JSProtocol */
'use strict';

JSProtocol("UITextEditorDelegate", JSProtocol, {

    textEditorDidReplaceCharactersInRange: ['textEditor', 'range', 'insertedText'],
    textEditorDidPositionCursors: ['textEditor']

});
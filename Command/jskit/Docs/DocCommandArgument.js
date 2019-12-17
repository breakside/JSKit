// #import "DocComponent.js"
/* global JSClass, DocComponent, DocCommandArgument */
'use strict';

 JSClass("DocCommandArgument", DocComponent, {

    kind: 'argv',

    // --------------------------------------------------------------------
    // MARK: - Naming

    getDisplayNameForKind: function(){
        return 'Command Line Argument';
    }

 });
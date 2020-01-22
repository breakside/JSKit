// #import "DocComponent.js"
'use strict';

 JSClass("DocCommandArgument", DocComponent, {

    kind: 'argv',

    // --------------------------------------------------------------------
    // MARK: - Naming

    getDisplayNameForKind: function(){
        return 'Command Line Argument';
    }

 });
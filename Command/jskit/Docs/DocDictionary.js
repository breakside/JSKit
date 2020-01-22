// #import "DocTopicBasedComponent.js"
'use strict';

 JSClass("DocDictionary", DocTopicBasedComponent, {

    kind: 'dictionary',
    defaultChildKind: 'dictproperty',

    // --------------------------------------------------------------------
    // MARK: - Naming

    getDisplayNameForKind: function(){
        return 'Dictionary';
    },

 });
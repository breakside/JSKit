// #import "DocTopicBasedComponent.js"
/* global JSClass, DocTopicBasedComponent, DocDictionary */
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
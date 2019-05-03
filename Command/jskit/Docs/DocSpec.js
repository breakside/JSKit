// #import "DocTopicBasedComponent.js"
/* global JSClass, DocTopicBasedComponent, DocSpec */
'use strict';

 JSClass("DocSpec", DocTopicBasedComponent, {

    kind: 'spec',
    defaultChildKind: 'specproperty',

    // --------------------------------------------------------------------
    // MARK: - Naming

    getDisplayNameForKind: function(){
        return 'Spec File Properties';
    },

    getTitle: function(){
        return "%s Spec File Properties".sprintf(this.parent.name);
    },

    getUniqueName: function(){
        return 'spec-file-properties';
    },

 });
// #import "DocMethod.js"
/* global JSClass, DocMethod, DocMethod */
'use strict';

 JSClass("DocConstructor", DocMethod, {

    kind: 'constructor',

    declarationCode: function(){
        var args = this.argumentStrings();
        return ["function %s(%s)".sprintf(this.parent.name, args.join(', '))];
    },

    getUniqueName: function(){
        if (this.uniquePrefix){
            return "%s-constructor".sprintf(this.uniquePrefix);
        }
        return "constructor";
    },

    getDisplayNameForKind: function(){
        return "Constructor";
    }

 });
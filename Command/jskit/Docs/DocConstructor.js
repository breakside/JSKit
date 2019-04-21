// #import "DocMethod.js"
/* global JSClass, DocMethod, DocMethod, DocConstructor */
'use strict';

 JSClass("DocConstructor", DocMethod, {

    kind: 'constructor',

    declarationCode: function(){
        var args = this.argumentStrings();
        return ["function %s(%s)".sprintf(this.parent.name, args.join(', '))];
    },

    getTitle: function(){
        if (this.uniquePrefix){
            return "%s %s Constructor".sprintf(this.parent.name, this.uniquePrefix.ucFirst());
        }
        return "%s Constructor".sprintf(this.parent.name);
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
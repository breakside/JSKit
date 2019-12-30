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
            return "%s %s Constructor".sprintf(this.parent.name, this.uniquePrefix.capitalizedString());
        }
        return "%s Constructor".sprintf(this.parent.name);
    },

    getBaseName: function(){
        return "constructor";
    },

    getDisplayNameForKind: function(){
        return "Constructor";
    }

 });
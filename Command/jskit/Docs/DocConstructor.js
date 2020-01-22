// #import "DocMethod.js"
'use strict';

JSClass("DocConstructor", DocMethod, {

    kind: 'constructor',

    declarationCode: function(){
        var args = this.argumentStrings();
        return ["function %s(%s)".sprintf(this.parent.name, args.join(', '))];
    },

    getTitle: function(){
        return "%s %s".sprintf(this.parent.name, this.getTitleWithoutParent());
    },

    getTitleWithoutParent: function(){
        if (this.uniquePrefix){
            var words = this.uniquePrefix.split('-');
            for (let i = 0, l = words.length; i < l; ++i){
                words[i] = words[i].capitalizedString();
            }
            return "%s Constructor".sprintf(words.join(" "));
        }
        return "Constructor";
    },

    getBaseName: function(){
        return "constructor";
    },

    getDisplayNameForKind: function(){
        return "Constructor";
    }

});
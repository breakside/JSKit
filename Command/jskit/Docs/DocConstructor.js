// #import "DocMethod.js"
'use strict';

 JSClass("DocConstructor", DocMethod, {

    kind: 'constructor',

    declarationCode: function(){
        var args = this.argumentStrings();
        return ["function %s(%s)".sprintf(this.parent.name, args.join(', '))];
    },

    getTitle: function(){
        if (this.uniquePrefix){
            var words = this.uniquePrefix.split('-');
            for (let i = 0, l = words.length; i < l; ++i){
                words[i] = words[i].capitalizedString();
            }
            return "%s %s Constructor".sprintf(this.parent.name, words.join(" "));
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
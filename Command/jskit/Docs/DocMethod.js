// #import "DocFunction.js"
/* global JSClass, DocFunction, DocMethod */
'use strict';

 JSClass("DocMethod", DocFunction, {

    kind: 'method',
    isStatic: false,
    uniquePrefix: null,

    getDisplayNameForKind: function(){
        if (this.isStatic){
            return "Class Method";
        }
        return "Instance Method";
    },

    extractPropertiesFromInfo: async function(info, documentation){
        await DocMethod.$super.extractPropertiesFromInfo.call(this, info, documentation);
        if (info.static){
            this.isStatic = true;
        }
        if (info.prefix){
            this.uniquePrefix = info.prefix;
        }
    },

    getUniqueName: function(){
        if (this.uniquePrefix){
            return "%s-%s".sprintf(this.uniquePrefix, this.name.toLowerCase());
        }
        return this.name.toLowerCase();
    },

    declarationCode: function(){
        var args = this.argumentStrings();
        if (this.isStatic){
            return ["static %s(%s)".sprintf(this.name, args.join(', '))];
        }
        return ["%s(%s)".sprintf(this.name, args.join(', '))];
    }

 });
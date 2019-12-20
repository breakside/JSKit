// #import "DocFunction.js"
/* global JSClass, DocFunction, DocMethod */
'use strict';

 JSClass("DocMethod", DocFunction, {

    kind: 'method',
    isStatic: false,
    uniquePrefix: null,
    uniqueSuffix: null,

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
        if (info.suffix){
            this.uniqueSuffix = info.suffix;
        }
    },

    getTitle: function(){
        return "%s.%s".sprintf(this.parent.name, this.name);
    },

    getUniqueName: function(){
        if (this.uniquePrefix && this.uniqueSuffix){
            return "%s-%s-%s".sprintf(this.uniquePrefix, this.name.toLowerCase(), this.uniqueSuffix);
        }
        if (this.uniquePrefix){
            return "%s-%s".sprintf(this.uniquePrefix, this.name.toLowerCase());
        }
        if (this.uniqueSuffix){
            return "%s-%s".sprintf(this.name.toLowerCase(), this.uniqueSuffix);
        }
        return this.name.toLowerCase();
    },

    declarationCode: function(){
        var args = this.argumentStrings();
        if (this.isStatic){
            return ["static %s(%s)".sprintf(this.name, args.join(', '))];
        }
        return ["%s(%s)".sprintf(this.name, args.join(', '))];
    },

    // --------------------------------------------------------------------
    // MARK: - JSON

    jsonObject: function(baseURL){
        let obj = DocMethod.$super.jsonObject.call(this, baseURL);
        if (this.isStatic){
            obj.static = true;
        }
        return obj;
    }

 });
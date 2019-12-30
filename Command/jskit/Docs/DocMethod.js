// #import "DocFunction.js"
/* global JSClass, DocFunction, DocMethod */
'use strict';

 JSClass("DocMethod", DocFunction, {

    kind: 'method',
    isStatic: false,

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
    },

    getTitle: function(){
        return "%s.%s".sprintf(this.parent.name, this.name);
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
// #import "DocComponent.js"
/* global JSClass, DocComponent */
'use strict';

 JSClass("DocEnum", DocComponent, {

    kind: 'enum',
    options: null,

    extractPropertiesFromInfo: async function(info, documentation){
        if (info.options){
            this.options = info.options;
        }else{
            this.options = [];
        }
    },

    // TODO: include options in html

    getDisplayNameForKind: function(){
        return 'Enum';
    }

 });
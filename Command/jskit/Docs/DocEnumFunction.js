// #import "DocComponent.js"
/* global JSClass, DocComponent, DocEnumFunction, DocFunction */
'use strict';

 JSClass("DocEnumFunction", DocFunction, {

    kind: 'enumfunction',

    getDisplayNameForKind: function(){
        return "Enum Function";
    },

    getTitle: function(){
        var title = "%s.%s".sprintf(this.parent.name, this.name);
        if (this.parent.parent && this.parent.parent.kind == 'class' || this.parent.parent.kind == 'protocol'){
            title = "%s.%s".sprintf(this.parent.parent.name, title);
        }
        return title;
    },

    declarationCode: function(){
        var args = this.argumentStrings();
        return ['%s: function(%s)'.sprintf(this.name, args.join(', '))];
    }

 });
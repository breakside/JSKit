// #import "DocTopicBasedComponent.js"
/* global JSClass, DocTopicBasedComponent, DocEnum, DocFunction, DocEnumOption */
'use strict';

 JSClass("DocEnum", DocTopicBasedComponent, {

    kind: 'enum',
    options: null,
    valueType: null,
    defaultChildKind: "enumoption",

    extractPropertiesFromInfo: async function(info, documentation){
        await DocEnum.$super.extractPropertiesFromInfo.call(this, info, documentation);
        if (info.options){
            this.options = info.options;
        }else{
            this.options = [];
        }
        if (info.type){
            this.valueType = info.type;
        }
    },

    getTitle: function(){
        return "%s.%s".sprintf(this.parent.name, this.name);
    },

    htmlArticleElements: function(document){
        var index = 1;
        var elements = DocEnum.$super.htmlArticleElements.call(this, document);
        var declaration = this.codeSectionElement(document, "Declaration", this.declarationCode());
        declaration.setAttribute("class", "declaration");
        elements.splice(index++, 0, declaration);
        return elements;
    },

    declarationCode: function(){
        if (this.parent && this.parent.kind == 'class' || this.parent.kind == 'protocol'){
            return ["%s.%s = { ... }".sprintf(this.parent.name, this.name)];
        }
        return ["%s = { ... }".sprintf(this.name)];
    },

    getDisplayNameForKind: function(){
        if (this.valueType){
            return "%s Enum".sprintf(this.valueType);
        }
        return 'Enum';
    }

 });
// #import "JSKit/JSArrayController.js"
/* global JSClass, JSArrayController, JSSparseArrayController */
'use strict';

JSClass('JSSparseArrayController', JSArrayController, {

    delegate    : null,

    init: function(){
        JSSparseArrayController.$super.init.call(this);
    },

    countOfArrangedObjects: function(){
        return this.totalObjectCount;
    },

    objectInArrangedObjectsAtIndex: function(index){
    },

    arrangedObjectsInRange: function(range){
    },

    insertObjectInArrangedObjectsAtIndex: function(object, index){
    },

    removeObjectFromArrangedObjectsAtIndex: function(index){
    },

    replaceObjectInArragendObjectsAtIndex: function(index){
    }

});

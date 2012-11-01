// #import "Foundation/JSArrayController.js"

function JSSparseArrayController(){
}

JSSparseArrayController.prototype = {
    
    delegate    : null,
    
    init: function(){
        this.$super.init.call(this);
        return this;
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
    },
    
};

JSSparseArrayController.$extends(JSArrayController);

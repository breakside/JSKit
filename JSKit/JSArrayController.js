// #import "Foundation/JSObject.js"

function JSArrayController(){
}

JSArrayController.prototype = {
    
    arrangedObjects    : null,
    contentArray       : null,
    
    init: function(){
        this.$super.init.call(this);
        this._arrangedObjects = [];
        this._contentArray = [];
        return this;
    },
    
    // -----------------------------------------------------------------------------
    // MARK: - Source Data
    
    setContentArray: function(contentArray){
        this._contentArray = contentArray;
        // didChange arrangedObjects
    },
    
    insertObjectInContentArrayAtIndex: function(){
    },
    
    removeObjectFromContentArrayAtIndex: function(){
    },
    
    replaceObjectInContentArrayAtIndex: function(){
    },
    
    // -----------------------------------------------------------------------------
    // MARK: - Arranged Objects
    
    getArrangedObjects: function(){
    },
    
    setArrangedObjects: function(){
    },
    
    arrangeObjects: function(){
    },
    
    insertObjectInArrangedObjectsAtIndex: function(){
    },
    
    removeObjectFromArrangedObjectsAtIndex: function(){
    },
    
    replaceObjectInArrangedObjectsAtIndex: function(){
    },
    
    // -----------------------------------------------------------------------------
    // MARK: - Sort Descriptors
    
    
    setSortDescriptors: function(sortDescriptors){
    },
    
    getSortDescriptors: function(){
    },
    
    // -----------------------------------------------------------------------------
    // MARK: - Selection
    
    getSelectionIndex: function(){
    },
    
    setSelectionIndex: function(){
    },
    
    getSelectionIndexes: function(){
    },
    
    setSelectionIndexes: function(){
    },
    
    getSelectedObject: function(){
    },
    
    setSelectedObject: function(){
    },
    
    getSelectedObjects :function(){
    },
    
    setSelectedObjects: function(){
    },
    
    selectNext: function(){
    },
    
    selectPrevios: function(){
    },
    
    canSelectNext: function(){
    },
    
    canSelectPrevious: function(){
    },
    
    // -----------------------------------------------------------------------------
    // MARK: - Adding/Removing Objects
};

JSArrayController.$extends(JSObject);

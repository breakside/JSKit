// #import "Foundation/JSObject.js"

// -----------------------------------------------------------------------------
// MARK: - Base Class

function JSValueTransformer(){
}

JSValueTransformer.prototype = {
    
    transformValue: function(value){
    },
    
    reverseTransformValue: function(value){
    },
    
};

JSValueTransformer.$extends(JSObject);

// -----------------------------------------------------------------------------
// MARK: - Dealing with null

function JSIsNullValueTransformer(){
}

JSIsNullValueTransformer.prototype = {
        
    transformValue: function(value){
        return value === null;
    },
        
    reverseTransformValue: function(value){
        throw Error("JSIsNullValueTranformer cannot reverseTranform value");
    },
    
};

JSIsNullValueTransformer.$extends(JSValueTransformer);

function JSIsNotNullValueTransformer(){
}

JSIsNotNullValueTransformer.prototype = {
        
    transformValue: function(value){
        return value !== null;
    },
        
    reverseTransformValue: function(value){
        throw Error("JSIsNullValueTranformer cannot reverseTranform value");
    },
    
};

JSIsNotNullValueTransformer.$extends(JSValueTransformer);


// -----------------------------------------------------------------------------
// MARK: - Dealing with empty

function JSIsEmptyValueTransformer(){
}

JSIsEmptyValueTransformer.prototype = {
    
    transformValue: function(value){
        return !value || !value.length;
    },
        
    reverseTransformValue: function(value){
        throw Error("JSIsEmptyValueTranformer cannot reverseTranform value");
    },
    
};

JSIsEmptyValueTransformer.$extends(JSValueTransformer);

function JSIsNotEmptyValueTransformer(){
}

JSIsNotEmptyValueTransformer.prototype = {
        
    transformValue: function(value){
        return value && value.length;
    },
        
    reverseTransformValue: function(value){
        throw Error("JSIsEmptyValueTranformer cannot reverseTranform value");
    },
    
};

JSIsNotEmptyValueTransformer.$extends(JSValueTransformer);

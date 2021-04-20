// #import Foundation
"use strict";

JSClass("DBObjectChange", JSObject, {

    object: null,
    property: null,
    operator: null,
    index: null,

    initWithObject: function(object, property, operator, index){
        this.object = object;
        this.property = property;
        this.operator = operator;
        this.index = index || null;
    }

});

DBObjectChange.set = function(object, property){
    return new DBObjectChange.initWithObject(object, property, DBObjectChange.Operator.set);
};

DBObjectChange.increment = function(object, property){
    return new DBObjectChange.initWithObject(object, property, DBObjectChange.Operator.increment);
};

DBObjectChange.insert = function(object, property, index){
    return new DBObjectChange.initWithObject(object, property, DBObjectChange.Operator.insert, index);
};

DBObjectChange.remove = function(object, property, index){
    return new DBObjectChange.initWithObject(object, property, DBObjectChange.Operator.remove, index);
};

DBObjectChange.Operator = {
    set: "set",
    increment: "increment",
    insert: "insert",
    remove: "remove"
};
// #import Foundation
"use strict";

JSClass("DBObjectChange", JSObject, {

    object: null,
    property: null,
    operator: null,
    operands: null,

    initWithObject: function(object, property, operator, operands){
        this.object = object;
        this.property = property;
        this.operator = operator;
        this.operands = operands || [];
    }

});

DBObjectChange.set = function(object, property){
    return new DBObjectChange.initWithObject(object, property, DBObjectChange.Operator.set);
};

DBObjectChange.increment = function(object, property, amount){
    if (amount === undefined){
        amount = 1;
    }
    return new DBObjectChange.initWithObject(object, property, DBObjectChange.Operator.increment, [amount]);
};

DBObjectChange.insert = function(object, property, index){
    return new DBObjectChange.initWithObject(object, property, DBObjectChange.Operator.insert, [index]);
};

DBObjectChange.delete = function(object, property, index){
    return new DBObjectChange.initWithObject(object, property, DBObjectChange.Operator.delete, [index]);
};

DBObjectChange.Operator = {
    set: "set",
    increment: "increment",
    insert: "insert",
    delete: "delete"
};
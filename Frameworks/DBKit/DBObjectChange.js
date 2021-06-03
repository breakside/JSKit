// Copyright 2021 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
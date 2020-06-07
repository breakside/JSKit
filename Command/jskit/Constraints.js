// Copyright 2020 Breakside Inc.
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
'use strict';

JSGlobalObject.constraintsFromSpecShorthand = function(shorthand){
    var constraints = [];
    var references = JSCopy(shorthand.references);
    if (shorthand.equalities){
        for (let i = 0, l = shorthand.equalities.length; i < l; ++i){
            let constraint = constraintFromEquality(shorthand.equalities[i], references);
            constraints.push(constraint);
        }
    }
    return constraints;
};

JSGlobalObject.constraintFromEquality = function(equality, references){
    var resolveNumber = function(token){
        if (token in references){
            return references[token];
        }
        if (token.match(/^\d+$/)){
            return parseInt(token);
        }
        if (token.match(/^\d+\.\d+$/)){
            return parseFloat(token);
        }
        return token;
    };
    var eq = equality.replace(/ /g, '');
    var l = eq.length;
    if (l === 0){
        throw new Error("Empty equality found");
    }
    var i = 0;
    var constraint = {};
    var token = '';
    while (i < l && eq[i] !== '.'){
        token += eq[i];
        ++i;
    }
    if (token.length === 0){
        throw new Error("Expecting item name to start equality: %s".sprintf(equality));
    }
    if (i === l){
        throw new Error("Expecting '.' in equality: %s".sprintf(equality));   
    }
    if (!(token in references)){
        constraint.firstItemName = token;
    }else{
        constraint.firstItem = references[token];
    }
    i += 1;
    token = '';
    while (i < l && eq[i] !== '<' && eq[i] !== '>' && eq[i] !== '=' && eq[i] !== '.'){
        token += eq[i];
        ++i;
    }
    if (token.length === 0){
        throw new Error("Expecting item attribute in start equality: %s".sprintf(equality));
    }
    if (i === l){
        throw new Error("Expecting '=' or '<=' or '>=' in equality: %s".sprintf(equality));   
    }
    if (eq[i] == '.'){
        if (!allowedProperties.has(token)){
            if (!allowedAttributes.has(token)){
                throw new Error("Property name '%s' not valid in equality: %s".sprintf(token, equality));
            }
        }
        constraint.firstProperty = token;
        i += 1;
        token = '';
        while (i < l && eq[i] !== '<' && eq[i] !== '>' && eq[i] !== '=' && eq[i] !== '.'){
            token += eq[i];
            ++i;
        }
        if (token.length === 0){
            throw new Error("Expecting item attribute in start equality: %s".sprintf(equality));
        }
        if (i === l){
            throw new Error("Expecting '=' or '<=' or '>=' in equality: %s".sprintf(equality));   
        }
    }
    if (!allowedAttributes.has(token)){
        throw new Error("Attribute name '%s' not valid in equality: %s".sprintf(token, equality));
    }
    constraint.firstAttribute = token;
    constraint.relation = 'equal';
    if (eq[i] == '<'){
        constraint.relation = 'lessThanOrEqual';
        ++i;
        if (i == l || eq[i] != '='){
            throw new Error("Expecting '<=' in equality: %s".sprintf(equality));
        }
    }else if (eq[i] == '>'){
        constraint.relation = 'greaterThanOrEqual';
        ++i;
        if (i == l || eq[i] != '='){
            throw new Error("Expecting '>=' in equality: %s".sprintf(equality));
        }
    }
    i += 1;
    if (i == l){
        throw new Error("Expecting right hand side of equality: %s".sprintf(equality));
    }
    token = '';
    while (i < l && eq[i] != '.' && eq[i] != '*' && eq[i] != '+' && eq[i] != '-' && eq[i] != '@'){
        token += eq[i];
        ++i;
    }
    if (token.length === 0){
        throw new Error("Expecting item or constant on right hand side of equality: %s".sprintf(equality));
    }
    if (i == l){
        constraint.constant = resolveNumber(token);
    }else{
        if (eq[i] == '.'){
            ++i;
            if (!(token in references)){
                constraint.secondItemName = token;
            }else{
                constraint.secondItem = references[token];
            }
            token = '';
            while (i < l && eq[i] != '.' && eq[i] != '*' && eq[i] != '+' && eq[i] != '-' && eq[i] != '@'){
                token += eq[i];
                ++i;
            }
            if (token.length === 0){
                throw new Error("Expecting item attribute right hand side of equality: %s".sprintf(equality));
            }
            if (eq[i] == '.'){
                if (!allowedProperties.has(token)){
                    if (!allowedAttributes.has(token)){
                        throw new Error("Property name '%s' not valid in equality: %s".sprintf(token, equality));
                    }
                }
                constraint.secondProperty = token;
                i += 1;
                token = '';
                while (i < l && eq[i] != '*' && eq[i] != '+' && eq[i] != '-' && eq[i] != '@'){
                    token += eq[i];
                    ++i;
                }
                if (token.length === 0){
                    throw new Error("Expecting item attribute right hand side of equality: %s".sprintf(equality));
                }
            }
            if (!allowedAttributes.has(token)){
                throw new Error("Attribute name '%s' not valid in equality: %s".sprintf(token, equality));
            }
            constraint.secondAttribute = token;
        }else if (eq[i] == '@'){
            constraint.constant = resolveNumber(token);
        }else{
            throw new Error("Unexpected token in equality: %s".sprintf(equality));
        }
        if (i < l && eq[i] == '*'){
            ++i;
            token = '';
            while (i < l && eq[i] != '+' && eq[i] != '-' && eq[i] != '@'){
                token += eq[i];
                ++i;
            }
            if (token.length === 0){
                throw new Error("Expecting multiplier in equality: %s".sprintf(equality));
            }
            constraint.multiplier = resolveNumber(token);
        }
        if (i < l && (eq[i] == '+') || (eq[i] == '-')){
            let sign = eq[i] == '-' ? -1 : 1;
            ++i;
            token = '';
            while (i < l && eq[i] != '@'){
                token += eq[i];
                ++i;
            }
            if (token.length === 0){
                throw new Error("Expecting constant in equality: %s".sprintf(equality));
            }
            constraint.constant = sign * resolveNumber(token);
        }
        if (i < l && eq[i] == '@'){
            ++i;
            token = eq.substr(i);
            if (token.length === 0){
                throw new Error("Expecting priority in equality: %s".sprintf(equality));
            }
            constraint.priority = resolveNumber(token);
        }
    }
    return constraint;
};

var allowedProperties = new Set(['margins']);
var allowedAttributes = new Set(['left', 'right', 'top', 'bottom', 'leading', 'trailing', 'width', 'height', 'centerX', 'centerY']);
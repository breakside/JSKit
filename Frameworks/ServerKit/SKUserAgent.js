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

JSClass("SKUserAgent", JSObject, {

    string: null,
    products: null,
    productsByIdentifier: null,
    comments: null,
    commentSet: null,

    initWithString: function(string){
        if (string === null || string === undefined){
            return null;
        }
        this.string = string;
        this.products = [];
        this.productsByIdentifier = new Set();
        this.comments = [];
        this.commentSet = new Set();
        this.parse();
    },

    parse: function(){
        var str = this.string;
        var i = 0;
        var l = this.string.length;
        var product = "";
        var version = "";
        var comment = "";
        while (i < l){
            while (str[i] == " " || str[i] == "\t"){
                ++i;
            }
            if (i < l){
                if (str[i] == "("){
                    comment = "";
                    ++i;
                    while (i < l && str[i] !== ")"){
                        if (str[i] == ";"){
                            comment = comment.trim();
                            if (comment !== ""){
                                this.addComment(comment);
                            }
                            comment = "";
                        }else{
                            comment += str[i];
                        }
                        ++i;
                    }
                    comment = comment.trim();
                    if (comment !== ""){
                        this.addComment(comment);
                    }
                    if (i < l){
                        ++i;
                    }
                }else{
                    product = "";
                    version = "";
                    while (i < l && str[i] !== "/" && str[i] !== " " && str[i] !== "\t"){
                        product += str[i];
                        ++i;
                    }
                    if (i < l && str[i] == "/"){
                        ++i;
                        while (i < l && str[i] !== "(" && str[i] !== " " && str[i] !== "\t"){
                            version += str[i];
                            ++i;
                        }
                    }
                    this.addProduct(product, version);
                }
            }
        }
    },

    addProduct: function(name, version){
        if (version === "" || version === undefined){
            version = null;
        }
        var product = {name: name, version: version};
        this.products.push(product);
        this.productsByIdentifier[name] = product;
        if (version !== null){
            this.productsByIdentifier["%s/%s".sprintf(name, version)] = product;
        }
    },

    addComment: function(comment){
        this.comments.push(comment);
        this.commentSet.add(comment);
    },

    containsProduct: function(name, version){
        if (version === undefined || version === null || version === ""){
            return name in this.productsByIdentifier;
        }
        return "%s/%s".sprintf(name, version) in this.productsByIdentifier;
    },

    versionOfProduct: function(name){
        var product = this.productsByIdentifier[name];
        if (product){
            return product.version;
        }
        return null;
    },

    containsComment: function(comment){
        return this.commentSet.has(comment);
    }

});


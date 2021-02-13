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
// #import Dispatch
// #import "SEIndexStore.js"
// #import "SETokenizer.js"
"use strict";

(function(){

var logger = JSLog("searchkit", "memory");

JSClass("SEIndexMemoryStore", SEIndexStore, {

    init: function(){
        this.dispatchQueue = JSDispatchQueue.init();
    },

    addDocument: function(document, tokenizerClass, completion, target){
        this.dispatchQueue.enqueue(SEIndexMemoryStoreAddJob, [this.objectID, document, tokenizerClass.className], function(error){
            if (error !== null){
                logger.error("add document failed: %{error}", error);
            }
            completion.call(target);
        }, this);
    },

    search: function(words, wordOptions, rankerClass, completion, target){
        this.dispatchQueue.enqueue(SEIndexMemoryStoreSearchJob, [this.objectID, words, wordOptions, rankerClass.className], function(error, documentIDs){
            if (error !== null){
                logger.error("search failed: %{error}", error);
                completion.call(target, []);
            }else{
                completion.call(target, documentIDs);
            }
        });
    },

    close: function(completion, target){
        this.dispatchQueue.destroy(completion, target);
    }

});

SEIndexMemoryStore.storageByObjectID = {};

var IndexNode = function(code, level){
    if (this === undefined){
        return new IndexNode(code, level); 
    }
    this.code = code;
    this.level = level;
    this.children = [];
    this.hits = [];
    this.searcher = JSBinarySearcher(this.children, IndexNode.searcherCompare);
};

IndexNode.prototype = {

    addHit: function(iterator, documentNumber, fieldNumber, wordNumber){
        if (iterator.character === null){
            this.hits.push([documentNumber, fieldNumber, wordNumber]);
        }else{
            var index = this.searcher.insertionIndexForValue(iterator.character.code);
            var child = this.children[index];
            if (child === undefined || child.code !== iterator.character.code){
                child = new IndexNode(iterator.character.code, this.level + 1);
                this.children.splice(index, 0, child);
            }
            iterator.increment();
            child.addHit(iterator, documentNumber, fieldNumber, wordNumber);
        }
    },

    nodeForWord: function(iterator){
        if (iterator.character === null){
            return this;
        }
        var child = this.searcher.itemMatchingValue(iterator.character.code);
        if (child !== null){
            iterator.increment();
            return child.nodeForWord(iterator);
        }
        return null;
    }

};

IndexNode.searcherCompare = function(code, child){
    return code - child.code;
};

JSClass("SEIndexMemoryStoreJob", JSDispatchJob, {

    root: null,
    documents: null,

    initWithArguments: function(args){
        SEIndexMemoryStoreJob.$super.initWithArguments.call(this, args);
        var storeID = this.args[0];
        var storage = SEIndexMemoryStore.storageByObjectID[storeID];
        if (!storage){
            storage = SEIndexMemoryStore.storageByObjectID[storeID] = {
                documents: [],
                root: new IndexNode(null, 0)
            };
        }
        this.root = storage.root;
        this.documents = storage.documents;
    }

});

JSClass("SEIndexMemoryStoreAddJob", SEIndexMemoryStoreJob, {

    run: function(completion){
        var document = this.args[1];
        var documentNumber = this.documents.length;
        this.documents.push(document.id);

        var tokenizerClass = JSClass.FromName(this.args[2]);
        var fields = SETokenizer.tokenizedFieldsFromDocument(document, tokenizerClass);
        var word;
        var words;
        var fieldNumber = 0;
        for (var field in fields){
            words = fields[field];
            for (var i = 0, l = words.length; i < l; ++i){
                word = words[i];
                this.root.addHit(word.unicodeIterator(), documentNumber, fieldNumber, i);
            }
            ++fieldNumber;
        }
        completion();
    }

});

JSClass("SEIndexMemoryStoreSearchJob", SEIndexMemoryStoreJob, {

    run: function(completion){
        var words = this.args[1];
        var wordOptions = this.args[2];
        var rankerClass = JSClass.FromName(this.args[3]);
        var hitsByWord = [];
        var word;
        var options;
        var i, l;
        for (i = 0, l = words.length; i < l; ++i){
            word = words[i];
            options = wordOptions[i];
            hitsByWord.push(this.hitsForWord(this.root, word, options.isPrefix));
        }

        var ranker = rankerClass.initWithWords(words, hitsByWord);
        var documents = ranker.rankedDocumentNumbers();
        for (i = documents.length - 1; i >= 0; --i){
            documents[i] = this.documents[documents[i]];
            if (documents[i] === null){
                documents.splice(i, 1);
            }
        }
        completion(documents);
    },

    hitsForWord: function(root, word, isPrefix){
        var node = root.nodeForWord(word.unicodeIterator());
        if (node === null){
            return [];
        }
        if (!isPrefix){
            return node.hits;
        }
        var hits = [];
        var stack = [node];
        var i, l;
        while (stack.length > 0){
            node = stack.shift();
            hits = hits.concat(node.hits);
            stack = stack.concat(node.children);
        }
        return hits;
    }

});

})();
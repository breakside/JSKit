// #import "Foundation/JSFileManager.js"
// #import "Foundation/JSBundle.js"
// #import "Foundation/JSData.js"
// #import "Foundation/JSURL.js"
/* global window, JSClass, JSObject, JSCopy, JSLazyInitProperty, JSFileManager, JSData, JSBundle, JSURL, jslog_create */
'use strict';

var logger = jslog_create("JSFileManager");

var fs = require('fs');
var pathLib = require('path');

JSFileManager.definePropertiesFromExtensions({

    // --------------------------------------------------------------------
    // MARK: - Opening the File System

    open: function(completion, target){
        // TODO: how to coordinate this with destroy() for testing?
        // Maybe keep track of created folders/files?
    },

    // --------------------------------------------------------------------
    // MARK: - Common Directories

    _getTemporaryDirectoryURL: function(){
        return this.persistentContainerURL.appendingPathComponent("Temp");
    },

    _getPersistentContainerURL: function(){
        var rootPath = bundle.info.JSFileManagerPersistentRootPath;
        if (rootPath){
            return JSURL.initWithString('%s://%s/Containers/%s'.sprintf(JSFileManager.Scheme.file, rootPath, JSBundle.mainBundleIdentifier));
        }
        return null;
    },

    // --------------------------------------------------------------------
    // MARK: - Checking for Items

    itemExistsAtURL: function(url, completion, target){
        if (!url.isAbsolute){
            logger.warn("relative URL passed to itemExistsAtURL");
        }
        if (url.scheme != JSFileManager.Scheme.file){
            throw new Error("JSFileManager.itemExistsAtURL unsupported scheme: %s".sprintf(url.scheme));
        }
        fs.stat(url.path, function(error, stats){
            completion.call(target, !error);
        });
    },

    // --------------------------------------------------------------------
    // MARK: - Item Attributes

    attributesOfItemAtURL: function(url, completion, target){
        if (!url.isAbsolute){
            logger.warn("relative URL passed to attributesOfItemAtURL");
        }
        if (url.scheme != JSFileManager.Scheme.file){
            throw new Error("JSFileManager.attributesOfItemAtURL unsupported scheme: %s".sprintf(url.scheme));
        }
        fs.lstat(url.path, function(error, stats){
            var attrs = null;
            if (!error){
                var itemType;
                if (stats.isSymbolicLink()){
                    itemType = JSFileManager.ItemType.symbolicLink;
                }else if (stats.isDirectory()){
                    itemType = JSFileManager.ItemType.folder;
                }else if (stats.isFile()){
                    itemType = JSFileManager.ItemType.file;
                }else{
                    itemType = JSFileManager.ItemType.other;
                }
                attrs = {
                    itemType: itemType,
                    created: Math.floor(stats.ctimeMs),
                    modified: Math.floor(stats.mtimeMs)
                };
            }
            completion.call(target, attrs);
        });
    },

    // --------------------------------------------------------------------
    // MARK: - Creating Folders

    createFolderAtURL: function(url, completion, target){
        if (!url.isAbsolute){
            logger.warn("relative URL passed to createFolderAtURL");
        }
        if (url.scheme != JSFileManager.Scheme.file){
            throw new Error("JSFileManager.createFolderAtURL unsupported scheme: %s".sprintf(url.scheme));
        }
        if (url.pathComponents.length === 1){
            throw new Error("JSFileManager.createFolderAtURL cannot create root path");
        }
        this._createFolderWithAncestorsAtURL(url, function(error){
            completion.call(target, error === null);
        });
    },

    _createFolderWithAncestorsAtURL: function(url, completion){
        var parent = url.removingLastPathComponent();
        var manager = this;
        var create = function(parentExists){
            if (parentExists){
                fs.mkdir(url.path, completion);
            }else{
                completion(false);
            }
        };
        if (parent.pathComponents.length === 0){
            completion(false);
        }else{
            fs.stat(parent.path, function(error, stat){
                if (error === null){
                    create(stat.isDirectory());
                }else{
                    manager._createFolderAtURL(parent, completion);
                }
            });
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Creating Files

    createFileAtURL: function(url, data, completion, target){
        if (!url.isAbsolute){
            logger.warn("relative URL passed to createFileAtURL");
        }
        if (url.scheme != JSFileManager.Scheme.file){
            throw new Error("JSFileManager.createFileAtURL unsupported scheme: %s".sprintf(url.scheme));
        }
        if (url.pathComponents.length === 1){
            throw new Error("JSFileManager.createFileAtURL cannot create root path");
        }
        var parent = url.removingLastPathComponent();
        var manager = this;
        var created = false;
        var create = function(parentExists){
            if (parentExists){
                fs.writeFile(url.path, data.bytes, function(error){
                    completion.call(target, error === null);
                });
            }else{
                completion.call(target, false);
            }
        };
        fs.stat(url.path, function(error, stat){
            if (error === null){
                // we don't want to overwrite a file that already exists
                completion.call(target, false);
            }else{
                fs.stat(parent.path, function(error, stat){
                    if (error === null){
                        create(stat.isDirectory());
                    }else{
                        manager._createFolderWithAncestorsAtURL(parent, function(error){
                            create(error === null);
                        });
                    }
                });
            }
        });
    },

    // --------------------------------------------------------------------
    // MARK: - Moving & Copying Items

    moveItemAtURL: function(url, toURL, completion, target){
        if (!url.isAbsolute){
            logger.warn("relative URL passed to moveItemAtURL");
            url = JSURL.initWithBaseURL(this.workingDirectoryURL, url);
        }
        if (!toURL.isAbsolute){
            logger.warn("relative URL passed to moveItemAtURL");
            toURL = JSURL.initWithBaseURL(this.workingDirectoryURL, toURL);
        }
        if (url.scheme != JSFileManager.Scheme.jskitfile){
            throw new Error("JSFileManager.moveItemAtURL unsupported scheme: %s".sprintf(url.scheme));
        }
        if (toURL.scheme != JSFileManager.Scheme.jskitfile){
            throw new Error("JSFileManager.moveItemAtURL unsupported scheme: %s".sprintf(toURL.scheme));
        }
        if (url.pathComponents.length === 1){
            throw new Error("JSFileManager.moveItemAtURL cannot move root path");
        }
        if (toURL.pathComponents.length === 1){
            throw new Error("JSFileManager.moveItemAtURL cannot move to root path");
        }
        if (url.path == toURL.path){
            throw new Error("JSFileManager.moveItemAtURL target and destination are the same");
        }
        var transaction = this.begin(JSFileManager.Permission.readwrite, JSFileManager.Tables.metadata);
        transaction.addCompletion(completion, target);
        var toParent = toURL.removingLastPathComponent();
        var manager = this;
        manager._metadataInTransactionAtURL(transaction, url, function(metadata){
            if (metadata === null){
                transaction.abort();
            }else{
                var move = function(toParentExists){
                    if (toParentExists){
                        metadata.parent = toParent.path;
                        transaction.metadata.put(metadata);
                    }else{
                        transaction.abort();
                    }
                };
                manager._metadataInTransactionAtURL(transaction, toParent, function(toParentMetadata){
                    if (toParentMetadata !== null){
                        move(true);
                    }else{
                        manager._createFolderInTransactionAtURL(transaction, toParent, move);
                    }
                });
            }
        });
    },

    copyItemAtURL: function(url, toURL, completion, target){
        if (!url.isAbsolute){
            logger.warn("relative URL passed to copyItemAtURL");
            url = JSURL.initWithBaseURL(this.workingDirectoryURL, url);
        }
        if (!toURL.isAbsolute){
            logger.warn("relative URL passed to copyItemAtURL");
            toURL = JSURL.initWithBaseURL(this.workingDirectoryURL, toURL);
        }
        if (url.scheme != JSFileManager.Scheme.jskitfile){
            throw new Error("JSFileManager.copyItemAtURL unsupported scheme: %s".sprintf(url.scheme));
        }
        if (toURL.scheme != JSFileManager.Scheme.jskitfile){
            throw new Error("JSFileManager.copyItemAtURL unsupported scheme: %s".sprintf(toURL.scheme));
        }
        if (url.pathComponents.length === 1){
            throw new Error("JSFileManager.copyItemAtURL cannot copy root path");
        }
        if (toURL.pathComponents.length === 1){
            throw new Error("JSFileManager.copyItemAtURL cannot copy to root path");
        }
        if (url.path == toURL.path){
            throw new Error("JSFileManager.copyItemAtURL target and destination are the same");
        }
        var transaction = this.begin(JSFileManager.Permission.readwrite, [JSFileManager.Tables.metadata, JSFileManager.Tables.data]);
        transaction.addCompletion(completion, target);
        var toParent = toURL.removingLastPathComponent();
        var manager = this;
        manager._metadataInTransactionAtURL(transaction, url, function(metadata){
            if (metadata === null){
                transaction.abort();
            }else{
                var copy = function(parentExists){
                    if (parentExists){
                        manager._copyItemInTransactionAtURL(transaction, url, toURL, toParent, metadata);
                    }else{
                        transaction.abort();
                    }
                };
                var manager = this;
                manager._metadataInTransactionAtURL(transaction, toParent, function(toParentMetadata){
                    if (toParentMetadata !== null){
                        copy(true);
                    }else{
                        manager._createFolderInTransactionAtURL(transaction, toParent, copy);
                    }
                });
            }
        });
    },

    _copyItemInTransactionAtURL: function(transaction, url, toURL, toParent, metadata){
        switch (metadata.itemType){
            case JSFileManager.ItemType.folder:
                this._copyFolderInTransactionAtURL(transaction, url, toURL, toParent, metadata);
                break;
            case JSFileManager.ItemType.file:
                this._copyFileInTransactionAtURL(transaction, url, toURL, toParent, metadata);
                break;
            case JSFileManager.ItemType.symbolicLink:
                this._copyMetadataInTransactionAtURL(transaction, url, toURL, toParent, metadata);
                break;
        }
    },

    _copyFileInTransactionAtURL: function(transaction, url, toURL, toParent, metadata){
        var getDataRequest = transaction.data.get(metadata.dataKey);
        getDataRequest.onsuccess = function(e){
            var addDataRequest = transaction.data.add(e.target.result);
            addDataRequest.onsuccess = function(e){
                var copiedMetadata = JSCopy(metadata);
                copiedMetadata.parent = toParent.path;
                copiedMetadata.dataKey = e.target.result;
                transaction.metadata.put(copiedMetadata);
            };
        };
    },

    _copyMetadataInTransactionAtURL: function(transaction, url, toURL, toParent, metadata){
        var copiedMetadata = JSCopy(metadata);
        copiedMetadata.parent = toParent.path;
        transaction.metadata.put(copiedMetadata);
    },

    _copyFolderInTransactionAtURL: function(transaction, url, toURL, toParent, metadata){
        this._copyMetadataInTransactionAtURL(transaction, url, toURL, toParent, metadata);
        var index = transaction.metadata.index(JSFileManager.Indexes.metadataPath);
        var childRequest = index.openCursor({parent: url.path});
        var children = [];
        childRequest.onsuccess = function(e){
            var cursor = e.target.result;
            if (cursor){
                var child = cursor.value;
                var childURL = url.appendingPathComponent(child.name);
                var childToURL = toURL.appendingPathComponent(child.name);
                this._copyItemInTransactionAtURL(transaction, childURL, childToURL, toURL, child);
            }
        };
    },

    // --------------------------------------------------------------------
    // MARK: - Removing Items

    removeItemAtURL: function(url, completion, target){
        if (!url.isAbsolute){
            logger.warn("relative URL passed to removeItemAtURL");
            url = JSURL.initWithBaseURL(this.workingDirectoryURL, url);
        }
        if (url.scheme != JSFileManager.Scheme.jskitfile){
            throw new Error("JSFileManager.removeItemAtURL unsupported scheme: %s".sprintf(url.scheme));
        }
        if (url.pathComponents.length === 1){
            throw new Error("JSFileManager.removeItemAtURL cannot remove root path");
        }
        var parent = url.removingLastPathComponent();
        var transaction = this.begin(JSFileManager.Permission.readwrite, [JSFileManager.Tables.metadata | JSFileManager.data]);
        transaction.addCompletion(completion, target);
        var index = transaction.metadata.index(JSFileManager.Indexes.metadataPath);
        this._metadataInTransactionAtURL(transaction, url, function(metadata){
            if (metadata !== null){
                this._removeItemInTransactionAtURL(transaction, url, parent, metadata);
            }else{
                transaction.abort();
            }
        });
    },

    _removeItemInTransactionAtURL: function(transaction, url, parent, metadata){
        switch (metadata.itemType){
            case JSFileManager.ItemType.folder:
                this._removeFolderInTransactionAtURL(transaction, url, parent, metadata);
                break;
            case JSFileManager.ItemType.file:
                this._removeFileInTransactionAtURL(transaction, url, parent, metadata);
                break;
            case JSFileManager.ItemType.symbolicLink:
                this._removeMetadataInTransactionAtURL(transaction, url, parent, metadata);
                break;
        }
    },

    _removeFileInTransactionAtURL: function(transaction, url, parent, metadata){
        this._removeMetadataInTransactionAtURL(transaction, url, parent, metadata);
        transaction.data.delete(metadata.dataKey);
    },

    _removeMetadataInTransactionAtURL: function(transaction, url, parent, metadata){
        var lookup = [parent.path, url.lastPathComponent];
        var index = transaction.metadata.index(JSFileManager.Indexes.metadataPath);
        var keyRequest = index.getKey(lookup);
        keyRequest.onsuccess = function(e){
            var key = e.target.result;
            if (key !== undefined){
                transaction.metadata.delete(key);
            }
        };
    },

    _removeFolderInTransactionAtURL: function(transaction, url, parent, metadata){
        this._removeMetadataInTransactionAtURL(transaction, url, parent, metadata);
        var index = transaction.metadata.index(JSFileManager.Indexes.metadataPath);
        var childRequest = index.openCursor({parent: url.path});
        var children = [];
        childRequest.onsuccess = function(e){
            var cursor = e.target.result;
            if (cursor){
                var child = cursor.value;
                var childURL = url.appendingPathComponent(child.name);
                this._removeItemInTransactionAtURL(transaction, childURL, url, child);
            }
        };
    },

    // --------------------------------------------------------------------
    // MARK: - File Contents

    contentsAtURL: function(url, completion, target){
        if (!url.isAbsolute){
            logger.warn("relative URL passed to contentsAtURL");
            url = JSURL.initWithBaseURL(this.workingDirectoryURL, url);
        }
        if (url.scheme != JSFileManager.Scheme.jskitfile){
            throw new Error("JSFileManager.contentsAtURL unsupported scheme: %s".sprintf(url.scheme));
        }
        var transaction = this.begin(JSFileManager.Permission.readonly, [JSFileManager.Tables.metadata, JSFileManager.Tables.data]);
        var data = null;
        var visitedURLSet = {};
        transaction.addCompletion(function(success){
            completion.call(target, data);
        }, this);
        this._contentsInTransactionAtURL(transaction, url, visitedURLSet, function(bytes){
            if (bytes !== null){
                data = JSData.initWithBytes(bytes);
            }
        });
    },

    _contentsInTransactionAtURL: function(transaction, url, visitedURLSet, callback){
        var uniqueURL = url.encodedString;
        if (uniqueURL in visitedURLSet){
            callback(null);
            return;
        }else{
            visitedURLSet[uniqueURL] = true;
        }
        var manager = this;
        manager._metadataInTransactionAtURL(transaction, url, function(metadata){
            switch (metadata.itemType){
                case JSFileManager.ItemType.folder:
                    callback(null);
                    break;
                case JSFileManager.ItemType.file:
                    var request = transaction.data.get(metadata.dataKey);
                    request.onsuccess = function(e){
                        callback(e.target.result);
                    };
                    break;
                case JSFileManager.ItemType.symbolicLink:
                    var link = JSURL.initWithString(metadata.link);
                    manager._contentsInTransactionAtURL(transaction, link, visitedURLSet, callback);
                    break;
            }
        });
    },

    // --------------------------------------------------------------------
    // MARK: - Symbolic Links

    createSymbolicLinkAtURL: function(url, toURL, completion, target){
        if (!url.isAbsolute){
            logger.warn("relative URL passed to createSymbolicLinkAtURL");
            url = JSURL.initWithBaseURL(this.workingDirectoryURL, url);
        }
        if (!toURL.isAbsolute){
            logger.warn("relative URL passed to createSymbolicLinkAtURL");
            toURL = JSURL.initWithBaseURL(this.workingDirectoryURL, toURL);
        }
        if (url.scheme != JSFileManager.Scheme.jskitfile){
            throw new Error("JSFileManager.createSymbolicLinkAtURL unsupported scheme: %s".sprintf(url.scheme));
        }
        if (toURL.scheme != JSFileManager.Scheme.jskitfile){
            throw new Error("JSFileManager.createSymbolicLinkAtURL unsupported scheme: %s".sprintf(toURL.scheme));
        }
        if (url.path == toURL.path){
            throw new Error("JSFileManager.createSymbolicLinkAtURL target and destination are the same");
        }
        var transaction = this.begin(JSFileManager.Permission.readwrite, JSFileManager.Tables.metadata);
        transaction.addCompletion(completion, target);
        var parent = url.removingLastPathComponent();
        var manager = this;
        var created = false;
        var create = function(parentExists){
            if (parentExists){
                var t = manager.timestamp;
                var metadata = {parent: parent.path, name: url.lastPathComponent, itemType: JSFileManager.ItemType.symbolicLink, created: t, updated: t, added: t, link: toURL.encodedString};
                transaction.metadata.add(metadata);
            }else{
                transaction.abort();
            }
        };
        manager._metadataInTransactionAtURL(transaction, parent, function(parentMetadata){
            if (parentMetadata !== null){
                create(true);
            }else{
                manager._createFolderInTransactionAtURL(transaction, parent, create);
            }
        });
    },

    // --------------------------------------------------------------------
    // MARK: - Destorying the File Manager

    destroy: function(completion, target){
        if (this._db){
            this._db.close();
        }
        var request = indexedDB.deleteDatabase(this._identifier);
        request.onsuccess = function(e){
            completion.call(target, true);
        };
        request.onerror = function(e){
            completion.call(target, false);
        };
    },

    // --------------------------------------------------------------------
    // MARK: - Database upgrades

    upgrade: function(oldVersion, newVersion){
        var version = oldVersion;
        if (!version){
            // If we don't have a version number, then it's a completely empty
            // database we should just create it from scratch instead of going
            // through every upgrade iteration.
            this._createCurrentVersion();
        }else{
            // If we have a version number, we have to do each upgrade one by one.
            // Upgrades are implemented as methods with names that match the
            // pattern: _upgradeVersionXToY, where Y = X + 1.
            var next;
            var method;
            do {
                next = version + 1;
                method = '_upgradeVersion' + version + 'To' + next;
                this[method]();
                version = next;
            } while (version < newVersion);
        }
    },

    _createCurrentVersion: function(){
        var metadata = this._db.createObjectStore(JSFileManager.Tables.metadata, {autoIncrement: true});
        var transaction = metadata.transaction;
        var pathIndex = metadata.createIndex(JSFileManager.Indexes.metadataPath, ["parent", "name"], {unique: true});
        var data = this._db.createObjectStore(JSFileManager.Tables.data, {autoIncrement: true});
        var t = this.timestamp;
        var root = {parent: '', name: '/', itemType: JSFileManager.ItemType.folder, created: t, updated: t, added: t};
        metadata.add(root);
    },

    _upgradeVersion1To2: function(){
    },

});


var JSFileManagerTransaction = function(db, storeName, permission){
    if (this === undefined){
        return new JSFileManagerTransaction(db, storeName, permission);
    }
    this.indexedDBTransaction = db.transaction(storeName, permission);
    this.indexedDBTransaction.addEventListener('abort', this);
    this.indexedDBTransaction.addEventListener('error', this);
    this.indexedDBTransaction.addEventListener('complete', this);
    this.completion = null;
    this.target = null;
    if (!(storeName instanceof Array)){
        storeName = [storeName];
    }
    for (var i = 0; i < storeName.length; ++i){
        this[storeName[i]] = this.indexedDBTransaction.objectStore(storeName[i]);
    }
};

JSFileManagerTransaction.prototype = {

    addCompletion: function(completion, target){
        this.completion = completion;
        this.target = target;
    },

    handleEvent: function(e){
        this.removeEventListeners();
        this[e.type](e);
    },

    abort: function(e){
        if (this.completion === null){
            return;
        }
        this.completion.call(this.target, false);
    },

    error: function(e){
        // error events should result in abort events, so we'll handle everything in the abort
    },

    complete: function(e){
        if (this.completion === null){
            return;
        }
        this.completion.call(this.target, true);
    },

    removeEventListeners: function(){
        this.indexedDBTransaction.removeEventListener('abort', this);
        this.indexedDBTransaction.removeEventListener('error', this);
        this.indexedDBTransaction.removeEventListener('complete', this);
    }

};

var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

var CURRENT_DATABASE_VERSION = 1;

JSFileManager.Scheme = {
    jskitfile: 'io.breakside.jskit.file',
    file: 'file',
    http: 'http',
    https: 'https',
    blob: 'blob'
};

JSFileManager.Tables = {
    // {parent: "/some/path", name: "filename.txt", itemType: 1, created: 1234, modified: 1234, added: 1234, dataKey: 1234}
    metadata: "metadata",
    // Blob
    data: "data"
};

JSFileManager.Indexes = {
    metadataPath: "path"
};

JSFileManager.Permission = {
    readonly: "readonly",
    readwrite: "readwrite"
};

})();
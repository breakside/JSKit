// #import "Promise+JS.js"
// #import "JSFileManager.js"
// #import "JSBundle.js"
// #import "JSData.js"
// #import "JSURL.js"
// #import "JSLog.js"
// jshint browser: true, worker: true
'use strict';

(function(){

var logger = JSLog("foundation", "files");

JSFileManager.definePropertiesFromExtensions({

    _db: null,

    error: null,

    // --------------------------------------------------------------------
    // MARK: - Working Directory

    workingDirectoryURL: JSLazyInitProperty('_getWorkingDirectoryURL'),

    // --------------------------------------------------------------------
    // MARK: - Opening the File System

    open: function(completion, target){
        logger.info("opening indexeddb file manager");
        if (!completion){
            completion = Promise.completion(function JSFileManager_open_promise_completion(status){
                if (status != JSFileManager.State.success){
                    return Promise.reject(status);
                }
                return status;
            });
        }
        var request = indexedDB.open(this._identifier, CURRENT_DATABASE_VERSION);
        var manager = this;
        request.onblocked = function JSFileManager_open_onblocked(e){
            logger.info("indexeddb file manager upgrade blocked by other windows");
            completion.call(target, JSFileManager.State.conflictingVersions);
        };
        request.onerror = function JSFileManager_open_onerror(e){
            var error = request.error;
            logger.error("indexeddb open error: ${error}", error);
            manager.error = error;
            completion.call(target, JSFileManager.State.genericFailure);
        };
        request.onupgradeneeded = function JSFileManager_open_onupgradeneeded(e){
            logger.info("indexeddb upgrade needed");
            logger.info("indexeddb upgrading");
            try{
                manager._db = e.target.result;
                manager.upgrade(e.oldVersion, e.newVersion);
            }catch (err){
                logger.error("indexeddb upgrade error: %{error}", err);
                completion.call(target, JSFileManager.State.genericFailure);
            }
        };
        request.onsuccess = function JSFileManager_open_onsuccess(e){
            logger.info("indexeddb open");
            manager._db = e.target.result;
            completion.call(target, JSFileManager.State.success);
        };
        return completion.promise;
    },

    // --------------------------------------------------------------------
    // MARK: - Paths to URLs

    urlForPath: function(path, baseURL, isDirectory){
        var url = JSURL.init();
        if (isDirectory && !path.endsWith('/')){
            path += '/';
        }
        url.path = path;
        if (path.startsWith("/")){
            url.scheme = JSFileManager.Scheme.jskitfile;
            url.host = "";
        }
        if (baseURL){
            url.resolveToBaseURL(baseURL);
        }
        return url;
    },

    pathForURL: function(url){
        return url.path;
    },

    // --------------------------------------------------------------------
    // MARK: - Common Directories

    _getTemporaryDirectoryURL: function(){
        return this.persistentContainerURL.appendingPathComponent("Temp", true);
    },

    _getPersistentContainerURL: function(){
        return JSURL.initWithString('%s:///Containers/%s/'.sprintf(JSFileManager.Scheme.jskitfile, JSBundle.mainBundleIdentifier));
    },

    _getWorkingDirectoryURL: function(){
        return this.persistentContainerURL.appendingPathComponent("Working", true);
    },

    begin: function(permission, stores){
        return new JSFileManagerTransaction(this._db, stores, permission);
    },

    // --------------------------------------------------------------------
    // MARK: - Checking for Items

    itemExistsAtURL: function(url, completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        if (!url.isAbsolute){
            logger.warn("relative URL passed to itemExistsAtURL");
            url.resolveToBaseURL(this.workingDirectoryURL);
        }
        if (url.scheme != JSFileManager.Scheme.jskitfile){
            throw new Error("JSFileManager.itemExistsAtURL unsupported scheme: %s".sprintf(url.scheme));
        }
        var exists = false;
        var transaction = this.begin(JSFileManager.Permission.read, JSFileManager.Tables.metadata);
        transaction.addCompletion(function JSFileManager_itemExists_completion(success){
            completion.call(target, success && exists);
        });
        this._metadataInTransactionAtURL(transaction, url, function JSFileManager_itemExists_metadata(metadata){
            exists = metadata !== null;
        });
        return completion.promise;
    },

    // --------------------------------------------------------------------
    // MARK: - Item Attributes

    attributesOfItemAtURL: function(url, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        if (!url.isAbsolute){
            logger.warn("relative URL passed to attributesOfItemAtURL");
            url.resolveToBaseURL(this.workingDirectoryURL);
        }
        if (url.scheme != JSFileManager.Scheme.jskitfile){
            throw new Error("JSFileManager.attributesOfItemAtURL unsupported scheme: %s".sprintf(url.scheme));
        }
        var metadata = null;
        var transaction = this.begin(JSFileManager.Permission.read, JSFileManager.Tables.metadata);
        transaction.addCompletion(function JSFileManager_attributesOfItem_completion(success){
            completion.call(target, metadata);
        });
        this._metadataInTransactionAtURL(transaction, url, function JSFileManager_attributesOfItem_metadata(metadata_){
            metadata = metadata_;
        });
        return completion.promise;
    },

    _metadataInTransactionAtURL: function(transaction, url, completion){
        var parent = url.removingLastPathComponent();
        try {
            var index = transaction.metadata.index(JSFileManager.Indexes.metadataPath);
            var lookup = [parent.path || '', url.lastPathComponent];
            var request = index.get(lookup);
            var metadata;
            request.onsuccess = function JSFileManager_metadata_onsuccess(e){
                logger.debug("found metadata");
                completion(e.target.result || null);
                // FIXME: url could include a symlink folder, in which case we won't
                // get a result here even if the url is valid after resolving the symlink.
                // While we could walk path component by path component, I was hoping to
                // avoid that work since each lookup has to be an async query and it would
                // take N run loops to resolve a path with N components
                // An option is to query all metadata on open, so lookups don't have to be
                // a synchronous, but that would be less than ideal if there are a large
                // number of files in the database.
                // Compromise could be to do a quick lookup for regular files/folders,
                // and the fallback here to a step-by-step lookup.  Downside is that would
                // make every lookup of a non-existent file slow.
            };
            request.onerror = function JSFileManager_metadata_onerror(e){
                logger.error("Error querying metadata: %{error}", request.error);
                completion(null);
            };
            logger.debug("looking up metadata");
        }catch(e){
            logger.error("Exception thrown querying metadata: %{error}", e);
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Creating Directories

    createDirectoryAtURL: function(url, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        if (!url.isAbsolute){
            logger.warn("relative URL passed to createDirectoryAtURL");
            url.resolveToBaseURL(this.workingDirectoryURL);
        }
        if (url.scheme != JSFileManager.Scheme.jskitfile){
            throw new Error("JSFileManager.createDirectoryAtURL unsupported scheme: %s".sprintf(url.scheme));
        }
        if (url.pathComponents.length === 1){
            throw new Error("JSFileManager.createDirectoryAtURL cannot create root path");
        }
        var transaction = this.begin(JSFileManager.Permission.readwrite, JSFileManager.Tables.metadata);
        transaction.addCompletion(completion, target);
        this._createDirectoryInTransactionAtURL(transaction, url, function JSFileManager_createDirectory_completion(success){
            if (!success){
                logger.info("create directory failed, aborting transaction");
                transaction.abort();
            }
        });
        return completion.promise;
    },

    _createDirectoryInTransactionAtURL: function(transaction, url, completion){
        var parent = url.removingLastPathComponent();
        var manager = this;
        var create = function JSFileManager_createDirectory_create(parentExists){
            if (parentExists){
                var t = manager.timestamp;
                var metadata = {parent: parent.path, name: url.lastPathComponent, itemType: JSFileManager.ItemType.directory, created: t, updated: t, added: t};
                var request = transaction.metadata.add(metadata);
                request.onsuccess = function JSFileManager_createDirectory_onsucess(){
                    completion(true);
                };
                request.onerror = function JSFileManager_createDirectory_onerror(e){
                    logger.error("indexeddb create directory error: %{error}", request.error);
                    completion(false);
                };
            }else{
                completion(false);
            }
        };
        if (parent.pathComponents.length === 0){
            completion(false);
        }else{
            manager._metadataInTransactionAtURL(transaction, parent, function JSFileManager_createDirectory_metadata(metadata){
                if (metadata !== null){
                    create(metadata.itemType == JSFileManager.ItemType.directory);
                    // TODO: follow symlink if needed, watch out for circular links
                    // (probably better taken care of in a common method like _metadataInTransaction)
                }else{
                    manager._createDirectoryInTransactionAtURL(transaction, parent, create);
                }
            });
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Creating Files

    createFileAtURL: function(url, data, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        if (!url.isAbsolute){
            logger.warn("relative URL passed to createFileAtURL");
            url.resolveToBaseURL(this.workingDirectoryURL);
        }
        if (url.scheme != JSFileManager.Scheme.jskitfile){
            throw new Error("JSFileManager.createFileAtURL unsupported scheme: %s".sprintf(url.scheme));
        }
        if (url.pathComponents.length === 1){
            throw new Error("JSFileManager.createFileAtURL cannot create root path");
        }
        var transaction = this.begin(JSFileManager.Permission.readwrite, [JSFileManager.Tables.metadata, JSFileManager.Tables.data]);
        transaction.addCompletion(completion, target);
        var parent = url.removingLastPathComponent();
        var manager = this;
        var created = false;
        var metadata = null;
        var create = function JSFileManager_createFile_create(parentExists){
            if (parentExists){
                var dataRequest;
                if (metadata === null){
                    dataRequest = transaction.data.add(data);
                }else{
                    dataRequest = transaction.data.put(data, metadata.dataKey);
                }
                dataRequest.onsuccess = function JSFileManager_createFile_onsuccess(e){
                    var t = manager.timestamp;
                    if (metadata === null){
                        metadata = {parent: parent.path, name: url.lastPathComponent, itemType: JSFileManager.ItemType.file, created: t, updated: t, added: t, dataKey: e.target.result};
                        transaction.metadata.add(metadata);
                    }else{
                        metadata.updated = t;
                        transaction.metadata.put(metadata);
                    }
                };
            }else{
                logger.info("could not create parent directory, aborting create file transaction");
                transaction.abort();
            }
        };
        manager._metadataInTransactionAtURL(transaction, url, function JSFileManager_createFile_metadata(existingMetadata){
            if (existingMetadata !== null){
                metadata = existingMetadata;
                create(true);
            }else{
                manager._metadataInTransactionAtURL(transaction, parent, function JSFileManager_createFile_parent_metadata(parentMetadata){
                    if (parentMetadata !== null){
                        create(parentMetadata.itemType == JSFileManager.ItemType.directory);
                    }else{
                        manager._createDirectoryInTransactionAtURL(transaction, parent, create);
                    }
                });
            }
        });
        return completion.promise;
    },

    // --------------------------------------------------------------------
    // MARK: - Moving & Copying Items

    moveItemAtURL: function(url, toURL, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        if (!url.isAbsolute){
            logger.warn("relative URL passed to moveItemAtURL");
            url.resolveToBaseURL(this.workingDirectoryURL);
        }
        if (!toURL.isAbsolute){
            logger.warn("relative URL passed to moveItemAtURL");
            toURL.resolveToBaseURL(this.workingDirectoryURL);
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
        manager._metadataInTransactionAtURL(transaction, url, function JSFileManager_moveItem_metadata(metadata){
            if (metadata === null){
                logger.info("received null metadata for item, aborting move transaction");
                transaction.abort();
            }else{
                var move = function JSFileManager_moveItem_move(toParentExists){
                    if (toParentExists){
                        metadata.parent = toParent.path;
                        transaction.metadata.put(metadata);
                    }else{
                        logger.info("could not create parent directory, aborting move transaction");
                        transaction.abort();
                    }
                };
                manager._metadataInTransactionAtURL(transaction, toParent, function JSFileManager_moveItem_parent_metadata(toParentMetadata){
                    if (toParentMetadata !== null){
                        move(true);
                    }else{
                        manager._createDirectoryInTransactionAtURL(transaction, toParent, move);
                    }
                });
            }
        });
        return completion.promise;
    },

    copyItemAtURL: function(url, toURL, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        if (!url.isAbsolute){
            logger.warn("relative URL passed to copyItemAtURL");
            url.resolveToBaseURL(this.workingDirectoryURL);
        }
        if (!toURL.isAbsolute){
            logger.warn("relative URL passed to copyItemAtURL");
            toURL.resolveToBaseURL(this.workingDirectoryURL);
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
        manager._metadataInTransactionAtURL(transaction, url, function JSFileManager_copyItem_metadata(metadata){
            if (metadata === null){
                logger.info("received null metadata, aborting copy transaction");
                transaction.abort();
            }else{
                var copy = function JSFileManager(parentExists){
                    if (parentExists){
                        manager._copyItemInTransactionAtURL(transaction, url, toURL, toParent, metadata);
                    }else{
                        logger.info("could not create parent directory, aborting copy transaction");
                        transaction.abort();
                    }
                };
                var manager = this;
                manager._metadataInTransactionAtURL(transaction, toParent, function JSFileManager_copyItem_parent_metadata(toParentMetadata){
                    if (toParentMetadata !== null){
                        copy(true);
                    }else{
                        manager._createDirectoryInTransactionAtURL(transaction, toParent, copy);
                    }
                });
            }
        });
        return completion.promise;
    },

    _copyItemInTransactionAtURL: function(transaction, url, toURL, toParent, metadata){
        switch (metadata.itemType){
            case JSFileManager.ItemType.directory:
                this._copyDirectoryInTransactionAtURL(transaction, url, toURL, toParent, metadata);
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
        getDataRequest.onsuccess = function JSFileManager_copyFile_getData_onsucess(e){
            var addDataRequest = transaction.data.add(e.target.result);
            addDataRequest.onsuccess = function JSFileManager_copyFile_addData_onsucess(e){
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

    _copyDirectoryInTransactionAtURL: function(transaction, url, toURL, toParent, metadata){
        this._copyMetadataInTransactionAtURL(transaction, url, toURL, toParent, metadata);
        var index = transaction.metadata.index(JSFileManager.Indexes.metadataPath);
        var childRequest = index.openCursor({parent: url.path});
        var children = [];
        childRequest.onsuccess = function JSFileManager_copyDirectory_onsucess(e){
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
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        if (!url.isAbsolute){
            logger.warn("relative URL passed to removeItemAtURL");
            url.resolveToBaseURL(this.workingDirectoryURL);
        }
        if (url.scheme != JSFileManager.Scheme.jskitfile){
            throw new Error("JSFileManager.removeItemAtURL unsupported scheme: %s".sprintf(url.scheme));
        }
        if (url.pathComponents.length === 1){
            throw new Error("JSFileManager.removeItemAtURL cannot remove root path");
        }
        var parent = url.removingLastPathComponent();
        var transaction = this.begin(JSFileManager.Permission.readwrite, [JSFileManager.Tables.metadata, JSFileManager.Tables.data]);
        transaction.addCompletion(completion, target);
        var index = transaction.metadata.index(JSFileManager.Indexes.metadataPath);
        var manager = this;
        this._metadataInTransactionAtURL(transaction, url, function JSFileManager_removeItem_metadata(metadata){
            if (metadata !== null){
                manager._removeItemInTransactionAtURL(transaction, url, parent, metadata);
            }else{
                logger.info("received null metadata, aborting remove transaction");
                transaction.abort();
            }
        });
        return completion.promise;
    },

    _removeItemInTransactionAtURL: function(transaction, url, parent, metadata){
        switch (metadata.itemType){
            case JSFileManager.ItemType.directory:
                this._removeDirectoryInTransactionAtURL(transaction, url, parent, metadata);
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
        keyRequest.onsuccess = function JSFileManager_removeMetadata_onsuccess(e){
            var key = e.target.result;
            if (key !== undefined){
                transaction.metadata.delete(key);
            }
        };
    },

    _removeDirectoryInTransactionAtURL: function(transaction, url, parent, metadata){
        this._removeMetadataInTransactionAtURL(transaction, url, parent, metadata);
        var index = transaction.metadata.index(JSFileManager.Indexes.metadataPath);
        var childRequest = index.openCursor([url.path]);
        var children = [];
        var manager = this;
        childRequest.onsuccess = function JSFileManager_removeDirectory_onsucess(e){
            var cursor = e.target.result;
            if (cursor){
                var child = cursor.value;
                var childURL = url.appendingPathComponent(child.name);
                manager._removeItemInTransactionAtURL(transaction, childURL, url, child);
            }
        };
    },

    // --------------------------------------------------------------------
    // MARK: - File Contents

    contentsAtURL: function(url, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        if (!url.isAbsolute){
            logger.warn("relative URL passed to contentsAtURL");
            url.resolveToBaseURL(this.workingDirectoryURL);
        }
        if (url.scheme != JSFileManager.Scheme.jskitfile){
            throw new Error("JSFileManager.contentsAtURL unsupported scheme: %s".sprintf(url.scheme));
        }
        var transaction = this.begin(JSFileManager.Permission.readonly, [JSFileManager.Tables.metadata, JSFileManager.Tables.data]);
        var contents = null;
        var visitedURLSet = {};
        transaction.addCompletion(function JSFileManager_contents_completion(success){
            completion.call(target, contents);
        }, this);
        this._contentsInTransactionAtURL(transaction, url, visitedURLSet, function JSFileManager_contents_contents(data){
            if (data !== null){
                contents = data;
            }
        });
        return completion.promise;
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
        manager._metadataInTransactionAtURL(transaction, url, function JSFileManager_contents_metadata(metadata){
            if (metadata === null){
                callback(null);
                return;
            }
            switch (metadata.itemType){
                case JSFileManager.ItemType.directory:
                    callback(null);
                    break;
                case JSFileManager.ItemType.file:
                    var request = transaction.data.get(metadata.dataKey);
                    request.onsuccess = function JSFileManager_conents_onsuccess(e){
                        callback(e.target.result);
                    };
                    break;
                case JSFileManager.ItemType.symbolicLink:
                    var link = JSURL.initWithString(metadata.link, url);
                    manager._contentsInTransactionAtURL(transaction, link, visitedURLSet, callback);
                    break;
            }
        });
    },

    // --------------------------------------------------------------------
    // MARK: - Directory Contents

    contentsOfDirectoryAtURL: function(url, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        if (!url.isAbsolute){
            logger.warn("relative URL passed to removeItemAtURL");
            url.resolveToBaseURL(this.workingDirectoryURL);
        }
        if (url.scheme != JSFileManager.Scheme.jskitfile){
            throw new Error("JSFileManager.removeItemAtURL unsupported scheme: %s".sprintf(url.scheme));
        }
        var transaction = this.begin(JSFileManager.Permission.readwrite, [JSFileManager.Tables.metadata]);
        transaction.addCompletion(completion, target);
        var index = transaction.metadata.index(JSFileManager.Indexes.metadataParent);
        var lookup = url.path;
        var request = index.getAll(lookup);
        var manager = this;
        request.onsuccess = function JSFileManager_contentsOfDirectory_onsuccess(e){
            var cursor = e.target.result;
            if (!cursor){
                completion.call(target, null);
                return;
            }
            var entries = [];
            var value;
            for (var i = 0, l = e.target.result.length; i < l; ++i){
                value = e.target.result[i];
                entries.push({
                    name: value.name,
                    url: url.appendingPathComponent(value.name, value.itemType == JSFileManager.ItemType.directory),
                    itemType: value.itemType
                });
            }
            completion.call(target, entries);
        };
        request.onerror = function JSFileManager_contentsOfDirectory_onerror(e){
            logger.error("error querying directory contents: ${error}", request.error);
            completion.call(target, null);
        };
        return completion.promise;
    },

    // --------------------------------------------------------------------
    // MARK: - Symbolic Links

    createSymbolicLinkAtURL: function(url, toURL, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        if (!url.isAbsolute){
            logger.warn("relative URL passed to createSymbolicLinkAtURL");
            url.resolveToBaseURL(this.workingDirectoryURL);
        }
        if (url.scheme != JSFileManager.Scheme.jskitfile){
            throw new Error("JSFileManager.createSymbolicLinkAtURL unsupported scheme: %s".sprintf(url.scheme));
        }
        if (toURL.scheme !== null && toURL.scheme != JSFileManager.Scheme.jskitfile){
            throw new Error("JSFileManager.createSymbolicLinkAtURL unsupported scheme: %s".sprintf(toURL.scheme));
        }
        if (url.path == toURL.path){
            throw new Error("JSFileManager.createSymbolicLinkAtURL target and destination are the same");
        }
        var absoluteToURL = toURL.resolvingToBaseURL(url);
        if (url.isEqual(absoluteToURL)){
            throw new Error("JSFileManager.createSymbolicLinkAtURL target and destination are the same");
        }
        var transaction = this.begin(JSFileManager.Permission.readwrite, JSFileManager.Tables.metadata);
        transaction.addCompletion(completion, target);
        var parent = url.removingLastPathComponent();
        var manager = this;
        var created = false;
        var create = function JSFileManager_createSymbolicLink_create(parentExists){
            if (parentExists){
                var t = manager.timestamp;
                var metadata = {parent: parent.path, name: url.lastPathComponent, itemType: JSFileManager.ItemType.symbolicLink, created: t, updated: t, added: t, link: toURL.encodedString};
                transaction.metadata.add(metadata);
            }else{
                logger.info("could not create parent directory, aborting create symlink transaction");
                transaction.abort();
            }
        };
        manager._metadataInTransactionAtURL(transaction, parent, function JSFileManager_createSymbolicLink_metadata(parentMetadata){
            if (parentMetadata !== null){
                create(true);
            }else{
                manager._createDirectoryInTransactionAtURL(transaction, parent, create);
            }
        });
        return completion.promise;
    },

    destinationOfSymbolicLinkAtURL: function(url, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        if (!url.isAbsolute){
            logger.warn("relative URL passed to attributesOfItemAtURL");
            url.resolveToBaseURL(this.workingDirectoryURL);
        }
        if (url.scheme != JSFileManager.Scheme.jskitfile){
            throw new Error("JSFileManager.attributesOfItemAtURL unsupported scheme: %s".sprintf(url.scheme));
        }
        var link = null;
        var transaction = this.begin(JSFileManager.Permission.read, JSFileManager.Tables.metadata);
        transaction.addCompletion(function JSFileManager_destinationOfSymbolicLink_completion(success){
            completion.call(target, link);
        });
        this._metadataInTransactionAtURL(transaction, url, function JSFileManager_destinationOfSymbolicLink_metadata(metadata){
            if (metadata && metadata.itemType == JSFileManager.ItemType.symbolicLink){
                link = JSURL.initWithString(metadata.link, url);
            }
        });
        return completion.promise;
    },

    // --------------------------------------------------------------------
    // MARK: - Destorying the File Manager

    destroy: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        if (this._db){
            this._db.close();
        }
        var request = indexedDB.deleteDatabase(this._identifier);
        request.onsuccess = function JSFileManager_destroy_onsuccess(e){
            completion.call(target, true);
        };
        request.onerror = function JSFileManager_destroy_onerror(e){
            logger.error("Unable to destroy file manager: %{error}", request.error);
            completion.call(target, false);
        };
        return completion.promise;
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
        var metadata = this._db.createObjectStore(JSFileManager.Tables.metadata, {autoIncrement: true, keyPath: "id"});
        var transaction = metadata.transaction;
        var pathIndex = metadata.createIndex(JSFileManager.Indexes.metadataPath, ["parent", "name"], {unique: true});
        var parentIndex = metadata.createIndex(JSFileManager.Indexes.metadataParent, "parent", {unique: false});
        var data = this._db.createObjectStore(JSFileManager.Tables.data, {autoIncrement: true});
        var t = this.timestamp;
        var root = {parent: '', name: '/', itemType: JSFileManager.ItemType.directory, created: t, updated: t, added: t};
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
        this['event_' + e.type](e);
    },

    _abortIsIntentional: false,

    abort: function(){
        this._abortIsIntentional = true;
        this.indexedDBTransaction.abort();
    },

    _complete: function(success){
        this.removeEventListeners();
        if (this.completion === null){
            return;
        }
        this.completion.call(this.target, false);
    },

    event_abort: function(e){
        if (!this._abortIsIntentional){
            if (this.indexedDBTransaction.error){
                logger.warn("indexeddb transaction aborted: ${error}", this.indexedDBTransaction.error);
            }else{
                logger.warn("indexeddb transaction aborted");
            }
        }
        this._complete(false);
    },

    event_error: function(e){
        logger.error(this.indexedDBTransaction.error);
        // error events should result in abort events, so we'll handle everything in the abort
    },

    event_complete: function(e){
        this._complete(true);
    },

    removeEventListeners: function(){
        this.indexedDBTransaction.removeEventListener('abort', this);
        this.indexedDBTransaction.removeEventListener('error', this);
        this.indexedDBTransaction.removeEventListener('complete', this);
    }

};

var indexedDB;

if (self){
    indexedDB = self.indexedDB;
}else if (window){
    indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
}

var CURRENT_DATABASE_VERSION = 1;

JSFileManager.Tables = {
    // {parent: "/some/path", name: "filename.txt", itemType: 1, created: 1234, modified: 1234, added: 1234, dataKey: 1234}
    metadata: "metadata",
    // Blob
    data: "data"
};

JSFileManager.Indexes = {
    metadataPath: "path",
    metadataParent: "parent"
};

JSFileManager.Permission = {
    readonly: "readonly",
    readwrite: "readwrite"
};

})();
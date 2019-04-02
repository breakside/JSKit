// #import "Foundation/JSFileManager.js"
// #import "Foundation/JSBundle.js"
// #import "Foundation/JSData.js"
// #import "Foundation/JSURL.js"
// #import "Foundation/JSLog.js"
/* global require, process, JSClass, JSObject, JSCopy, JSLazyInitProperty, JSFileManager, JSData, JSBundle, JSURL, JSLog */
'use strict';

var logger = JSLog("foundation", "files");

var fs = require('fs');
var pathLib = require('path');

JSFileManager.definePropertiesFromExtensions({

    _rootURL: null,
    _platform: process.platform,

    // --------------------------------------------------------------------
    // MARK: - Opening the File System

    open: function(completion, target){
        if (!completion){
            completion = Promise.completion(function(status){
                if (status != JSFileManager.State.success){
                    return Promise.reject(status);
                }
                return status;
            });
        }
        this._rootURL = this.urlForPath(pathLib.join(process.cwd(), 'io.breakside.jskit.JSFileManager'), true);
        completion.call(target, JSFileManager.State.success);
        return completion.promise;
    },

    // --------------------------------------------------------------------
    // MARK: - Paths to URLs

    urlForPath: function(path, baseURL, isDirectory){
        if (pathLib.sep != "/"){
            path = path.split(pathLib.sep).join("/");
        }
        var url = JSURL.init();
        if (isDirectory && !path.endsWith('/')){
            path += '/';
        }
        url.path = path;
        var firstComponent = url.pathComponents[0];
        if (process.platform == 'win32'){
            if (firstComponent.endsWith(':')){
                url.scheme = JSFileManager.Scheme.file;
                url.host = "";
            }
        }else{
            if (firstComponent == "/"){
                url.scheme = JSFileManager.Scheme.file;
                url.host = "";
            }
        }
        if (baseURL){
            url.resolveToBaseURL(baseURL);
        }
        return url;
    },

    _pathForURL: function(url){
        var path = url.path;
        if (pathLib.sep != "/"){
            path = path.split("/").join(pathLib.sep);
        }
        if (process.platform == 'win32'){
            if (path.startsWith("\\")){
                path = path.substr(1);
            }
        }
        return path;
    },

    // --------------------------------------------------------------------
    // MARK: - Common Directories

    _getTemporaryDirectoryURL: function(){
        return this.persistentContainerURL.appendingPathComponent("Temp", true);
    },

    _getPersistentContainerURL: function(){
        return this._rootURL.appendingPathComponent(JSBundle.mainBundleIdentifier, true);
    },

    // --------------------------------------------------------------------
    // MARK: - Checking for Items

    itemExistsAtURL: function(url, completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        if (!url.isAbsolute){
            logger.warn("relative URL passed to itemExistsAtURL");
        }
        if (url.scheme != JSFileManager.Scheme.file){
            throw new Error("JSFileManager.itemExistsAtURL unsupported scheme: %s".sprintf(url.scheme));
        }
        var path = this._pathForURL(url);
        fs.stat(path, function(error, stats){
            completion.call(target, error === null);
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
        }
        if (url.scheme != JSFileManager.Scheme.file){
            throw new Error("JSFileManager.attributesOfItemAtURL unsupported scheme: %s".sprintf(url.scheme));
        }
        var path = this._pathForURL(url);
        fs.lstat(path, function(error, stats){
            var attrs = null;
            if (!error){
                var itemType;
                if (stats.isSymbolicLink()){
                    itemType = JSFileManager.ItemType.symbolicLink;
                }else if (stats.isDirectory()){
                    itemType = JSFileManager.ItemType.directory;
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
        return completion.promise;
    },

    // --------------------------------------------------------------------
    // MARK: - Creating Directories

    createDirectoryAtURL: function(url, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        if (!url.isAbsolute){
            logger.warn("relative URL passed to createDirectoryAtURL");
        }
        if (url.scheme != JSFileManager.Scheme.file){
            throw new Error("JSFileManager.createDirectoryAtURL unsupported scheme: %s".sprintf(url.scheme));
        }
        if (url.pathComponents.length === 1){
            throw new Error("JSFileManager.createDirectoryAtURL cannot create root path");
        }
        this._createDirectoryWithAncestorsAtURL(url, function(error){
            completion.call(target, error === null);
        });
        return completion.promise;
    },

    _createDirectoryWithAncestorsAtURL: function(url, completion){
        var parent = url.removingLastPathComponent();
        var manager = this;
        var create = function(parentError){
            if (parentError === null){
                var path = manager._pathForURL(url);
                fs.mkdir(path, function(error){
                    completion(error);
                });
            }else{
                completion(parentError);
            }
        };
        if (parent.pathComponents.length === 0){
            completion(new Error("Parent has no path"));
        }else{
            var path = manager._pathForURL(parent);
            fs.stat(path, function(error, stat){
                if (error === null){
                    create(stat.isDirectory() ? null : new Error("Parent is not a directory"));
                }else{
                    manager._createDirectoryWithAncestorsAtURL(parent, create);
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
                var path = manager._pathForURL(url);
                fs.writeFile(path, data, function(error){
                    completion.call(target, error === null);
                });
            }else{
                completion.call(target, false);
            }
        };
        var path = manager._pathForURL(parent);
        fs.stat(path, function(error, stat){
            if (error === null){
                create(stat.isDirectory());
            }else{
                manager._createDirectoryWithAncestorsAtURL(parent, function(error){
                    create(error === null);
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
        }
        if (!toURL.isAbsolute){
            logger.warn("relative URL passed to moveItemAtURL");
        }
        if (url.scheme != JSFileManager.Scheme.file){
            throw new Error("JSFileManager.moveItemAtURL unsupported scheme: %s".sprintf(url.scheme));
        }
        if (toURL.scheme != JSFileManager.Scheme.file){
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
        var toParent = toURL.removingLastPathComponent();
        var manager = this;
        var path = manager._pathForURL(url);
        var toPath = manager._pathForURL(toURL);
        fs.stat(path, function(error, stat){
            var move = function(toParentExists){
                if (toParentExists){
                    fs.rename(path, toPath, function(error){
                        completion.call(target, error === null);
                    });
                }else{
                    completion.call(target, false);
                }
            };
            if (error === null){
                move(stat.isDirectory());
            }else{
                manager._createDirectoryWithAncestorsAtURL(toParent, function(error){
                    move(error === null);
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
        }
        if (!toURL.isAbsolute){
            logger.warn("relative URL passed to copyItemAtURL");
        }
        if (url.scheme != JSFileManager.Scheme.file){
            throw new Error("JSFileManager.copyItemAtURL unsupported scheme: %s".sprintf(url.scheme));
        }
        if (toURL.scheme != JSFileManager.Scheme.file){
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
        var toParent = toURL.removingLastPathComponent();
        var manager = this;
        var path = manager._pathForURL(url);
        fs.stat(path, function(error, stat){
            var copy = function(toParentExists){
                if (toParentExists){
                    manager._copyItemAtURL(url, toURL, stat, completion, target);
                }else{
                    completion.call(target, false);
                }
            };
            if (error === null){
                copy(stat.isDirectory());
            }else{
                manager._createDirectoryWithAncestorsAtURL(toParent, function(error){
                    copy(error === null);
                });
            }
        });
        return completion.promise;
    },

    _copyItemAtURL: function(url, toURL, stat, completion, target){
        if (stat.isDirectory()){
            this._copyDirectoryAtURL(url, toURL, completion, target);
        }else{
            this._copyFileAtURL(url, toURL, completion, target);
        }
    },

    _copyFileAtURL: function(url, toURL, completion, target){
        var path = this._pathForURL(url);
        var toPath = this._pathForURL(toURL);
        fs.copy(path, toPath, function(error){
            completion.call(target, error === null);
        });
    },

    _copyDirectoryAtURL: function(url, toURL, completion, target){
        var manager = this;
        var path = manager._pathForURL(url);
        var toPath = manager._pathForURL(toURL);
        fs.mkdir(toPath, function(error){
            if (error === null){
                fs.readdir(path, function(error, files){
                    var i = 0;
                    var copyNextChild = function(){
                        if (i === files.length){
                            completion.call(target, true);
                        }else{
                            var childURL = url.appendingPathComponent(files[i]);
                            var toChildURL = toURL.appendingPathComponent(files[i]);
                            var childPath = manager._pathForURL(childURL);
                            fs.stat(childPath, function(error, stat){
                                manager._copyItemAtURL(childURL, toChildURL, stat, function(success){
                                    if (success){
                                        ++i;
                                        copyNextChild();
                                    }else{
                                        completion.call(target, false);
                                    }
                                });
                            });
                        }
                    };
                    if (error === null){
                        copyNextChild();
                    }else{
                        completion.call(target, false);
                    }
                });
            }else{
                completion.call(target, false);
            }
        });
    },

    // --------------------------------------------------------------------
    // MARK: - Removing Items

    removeItemAtURL: function(url, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        if (!url.isAbsolute){
            logger.warn("relative URL passed to removeItemAtURL");
        }
        if (url.scheme != JSFileManager.Scheme.file){
            throw new Error("JSFileManager.removeItemAtURL unsupported scheme: %s".sprintf(url.scheme));
        }
        if (url.pathComponents.length === 1){
            throw new Error("JSFileManager.removeItemAtURL cannot remove root path");
        }
        var manager = this;
        var path = manager._pathForURL(url);
        fs.lstat(path, function(error, stats){
            if (error === null){
                manager._removeItemAtURL(url, stats, completion, target);
            }else{
                completion.call(target, false);
            }
        });
        return completion.promise;
    },

    _removeItemAtURL: function(url, stat, completion, target){
        if (stat.isDirectory()){
            this._removeDirectoryAtURL(url, completion, target);
        }else{
            this._removeFileAtURL(url, completion, target);
        }
    },

    _removeFileAtURL: function(url, completion, target){
        var path = this._pathForURL(url);
        fs.unlink(path, function(error){
            completion.call(target, error === null);
        });
    },

    _removeDirectoryAtURL: function(url, completion, target){
        var manager = this;
        var path = this._pathForURL(url);
        fs.readdir(path, function(error, files){
            if (error === null){
                var i = 0;
                var removeNextChild = function(){
                    if (i == files.length){
                        fs.rmdir(path, function(error){
                            completion.call(target, error === null);
                        });
                    }else{
                        var childURL = url.appendingPathComponent(files[i]);
                        var childPath = manager._pathForURL(childURL);
                        fs.lstat(childPath, function(error, stat){
                            manager._removeItemAtURL(childURL, stat, function(success){
                                if (success){
                                    ++i;
                                    removeNextChild();
                                }else{
                                    completion.call(target, false);
                                }
                            });
                        });
                    }
                };
                removeNextChild();
            }else{
                completion.call(target, false);
            }
        });
    },

    // --------------------------------------------------------------------
    // MARK: - File Contents

    contentsAtURL: function(url, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        if (!url.isAbsolute){
            logger.warn("relative URL passed to contentsAtURL");
        }
        if (url.scheme != JSFileManager.Scheme.file){
            throw new Error("JSFileManager.contentsAtURL unsupported scheme: %s".sprintf(url.scheme));
        }
        var path = this._pathForURL(url);
        fs.readFile(path, function(error, buffer){
            if (error === null){
                completion.call(target, JSData.initWithNodeBuffer(buffer));
            }else{
                completion.call(target, null);
            }
        });
        return completion.promise;
    },

    // --------------------------------------------------------------------
    // MARK: - Directory Contents

    contentsOfDirectoryAtURL: function(url, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var path = this._pathForURL(url);
        var manager = this;
        fs.readdir(path, {withFileTypes: true}, function(error, entries){
            if (error !== null){
                completion.call(target, error);
                return;
            }
            var contents = [];
            var entry;
            var itemType;
            for (var i = 0, l = entries.length; i < l; ++i){
                entry = entries[i];
                if (entry.isSymbolicLink()){
                    itemType = JSFileManager.ItemType.symbolicLink;
                }else if (entry.isDirectory()){
                    itemType = JSFileManager.ItemType.directory;
                }else if (entry.isFile()){
                    itemType = JSFileManager.ItemType.file;
                }else{
                    itemType = JSFileManager.ItemType.other;
                }
                contents.push({
                    url: url.appendingPathComponent(entry.name),
                    name: entry.name,
                    itemType: itemType
                });
            }
            completion.call(target, contents);
        });
        return completion;
    },

    // --------------------------------------------------------------------
    // MARK: - Symbolic & Hard Links

    createSymbolicLinkAtURL: function(url, toURL, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        if (!url.isAbsolute){
            logger.warn("relative URL passed to createSymbolicLinkAtURL");
        }
        if (url.scheme != JSFileManager.Scheme.file){
            throw new Error("JSFileManager.createSymbolicLinkAtURL unsupported scheme: %s".sprintf(url.scheme));
        }
        if (toURL.scheme !== null && toURL.scheme != JSFileManager.Scheme.file){
            throw new Error("JSFileManager.createSymbolicLinkAtURL unsupported scheme: %s".sprintf(toURL.scheme));
        }
        var absoluteToURL = toURL.resolvingToBaseURL(url);
        if (url.isEqual(absoluteToURL)){
            throw new Error("JSFileManager.createSymbolicLinkAtURL target and destination are the same");
        }
        var path = this._pathForURL(url);
        var toPath = this._pathForURL(toURL);
        fs.symlink(toPath, path, function(error){
            completion.call(target, error === null);
        });
        return completion.promise;
    },

    destinationOfSymbolicLinkAtURL: function(url, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var path = this._pathForURL(url);
        var manager = this;
        fs.readlink(path, function(error, destination){
            if (error !== null){
                completion.call(target, null);
                return;
            }
            var destinationURL = manager.urlForPath(destination, url);
            completion.call(target, destinationURL);
        });
        return completion.promise;
    },

    // --------------------------------------------------------------------
    // MARK: - Destorying the File Manager

    destroy: function(completion, target){
        var manager = this;
        var rootPath = this._pathForURL(this._rootURL);
        fs.stat(rootPath, function(error, stat){
            if (error === null){
                manager._removeItemAtURL(manager._rootURL, stat, function(success){
                    completion.call(target, success);
                });
            }else{
                completion.call(target, true);
            }
        });
    },

});
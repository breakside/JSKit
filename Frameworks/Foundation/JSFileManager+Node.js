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

// #import "Promise+JS.js"
// #import "JSFileManager.js"
// #import "JSBundle.js"
// #import "JSData.js"
// #import "JSURL.js"
// #import "JSLog.js"
// jshint node: true
'use strict';

var logger = JSLog("foundation", "files");

var fs = require('fs');
var pathLib = require('path');

JSFileManager.definePropertiesFromExtensions({

    initWithIdentifier: function(identifier){
        return JSNodeFileManager.initWithIdentifier(identifier);
    },

});

JSFileManager.defineInitMethod("initWithIdentifier");

JSClass("JSNodeFileManager", JSFileManager, {

    initWithIdentifier: function(identifier){
        this._identifier = identifier;
    },

    _identifier: null,

    _rootURL: null,

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
        this._rootURL = this.urlForPath(pathLib.join(process.cwd(), this._identifier), true);
        var v1Path = this.pathForURL(this._rootURL.appendingPathComponent(this._identifier, true));
        var v1Exists = fs.existsSync();
        if (v1Exists){
            var v2Path = this.pathForURL(this.persistentContainerURL);
            logger.info("Moving persistentContainerURL from %{public} to %{public}", v1Path, v2Path);
            fs.renameSync(v1Path, v2Path);
        }
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

    pathForURL: function(url){
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
        return this._rootURL.appendingPathComponents(["Containers", JSBundle.mainBundleIdentifier], true);
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
        var path = this.pathForURL(url);
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
        var path = this.pathForURL(url);
        fs.lstat(path, function(error, stats){
            var attrs = null;
            if (!error){
                attrs = {
                    itemType: JSFileManager.ItemType.fromStat(stats),
                    created: Math.floor(stats.ctimeMs / 1000.0),
                    updated: Math.floor(stats.mtimeMs / 1000.0),
                    size: stats.size
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
                var path = manager.pathForURL(url);
                fs.stat(path, function(error, stat){
                    if (error !== null){
                        fs.mkdir(path, function(error){
                            if (!error){
                                manager.postNotificationForURL(parent, JSFileManager.Notification.directoryDidAddItem, {url: url, name: url.lastPathComponent, itemType: JSFileManager.ItemType.directory});
                            }
                            completion(error);
                        });
                    }else{
                        completion(null);
                    }
                });
            }else{
                completion(parentError);
            }
        };
        if (parent.pathComponents.length === 0){
            completion(new Error("Parent has no path"));
        }else{
            var path = manager.pathForURL(parent);
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
                var path = manager.pathForURL(url);
                fs.writeFile(path, data, function(error){
                    if (!error){
                        manager.postNotificationForURL(parent, JSFileManager.Notification.directoryDidAddItem, {url: url, name: url.lastPathComponent, itemType: JSFileManager.ItemType.file});
                    }
                    completion.call(target, error === null);
                });
            }else{
                completion.call(target, false);
            }
        };
        var path = manager.pathForURL(parent);
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
    // MARK: - Permissions

    makeExecutableAtURL: function(url, data, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        if (!url.isAbsolute){
            logger.warn("relative URL passed to makeExecutableAtURL");
        }
        if (url.scheme != JSFileManager.Scheme.file){
            throw new Error("JSFileManager.makeExecutableAtURL unsupported scheme: %s".sprintf(url.scheme));
        }
        var path = this.pathForURL(url);
        fs.chmod(path, 493, function(error){
            completion.call(target, error === null);
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
        var parent = url.removingLastPathComponent();
        var toParent = toURL.removingLastPathComponent();
        var manager = this;
        var path = manager.pathForURL(url);
        var toPath = manager.pathForURL(toURL);
        var toParentPath = manager.pathForURL(toParent);
        fs.stat(toParentPath, function(error, stat){
            var move = function(toParentExists){
                if (toParentExists){
                    fs.stat(path, function(error, stat){
                        if (!error){
                            var itemType = JSFileManager.ItemType.fromStat(stat);
                            fs.rename(path, toPath, function(error){
                                if (!error){
                                    manager.postNotificationForURL(parent, JSFileManager.Notification.directoryDidRemoveItem, {url: url, name: url.lastPathComponent, itemType: itemType});
                                    manager.postNotificationForURL(toParent, JSFileManager.Notification.directoryDidAddItem, {url: toURL, name: toURL.lastPathComponent, itemType: itemType});
                                }
                                completion.call(target, error === null);
                            });
                        }else{
                            completion.call(target, false);
                        }
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
        var toParentPath = manager.pathForURL(toParent);
        fs.stat(toParentPath, function(error, stat){
            var copy = function(toParentExists){
                if (toParentExists){
                    var path = manager.pathForURL(url);
                    fs.stat(path, function(error, stat){
                        if (error === null){
                            manager._copyItemAtURL(url, toURL, stat, completion, target);
                        }else{
                            completion.call(target, false);
                        }
                    });
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
        var path = this.pathForURL(url);
        var toPath = this.pathForURL(toURL);
        var toParent = toURL.removingLastPathComponent();
        var manager = this;
        fs.copyFile(path, toPath, function(error){
            if (!error){
                manager.postNotificationForURL(toParent, JSFileManager.Notification.directoryDidAddItem, {url: toURL, name: toURL.lastPathComponent, itemType: JSFileManager.ItemType.file});
            }
            completion.call(target, error === null);
        });
    },

    _copyDirectoryAtURL: function(url, toURL, completion, target){
        var manager = this;
        var path = manager.pathForURL(url);
        var toPath = manager.pathForURL(toURL);
        var toParent = toURL.removingLastPathComponent();
        fs.mkdir(toPath, function(error){
            if (error === null){
                manager.postNotificationForURL(toParent, JSFileManager.Notification.directoryDidAddItem, {url: toURL, name: toURL.lastPathComponent, itemType: JSFileManager.ItemType.directory});
                fs.readdir(path, function(error, files){
                    var i = 0;
                    var copyNextChild = function(){
                        if (i === files.length){
                            completion.call(target, true);
                        }else{
                            var childURL = url.appendingPathComponent(files[i]);
                            var toChildURL = toURL.appendingPathComponent(files[i]);
                            var childPath = manager.pathForURL(childURL);
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
        var path = manager.pathForURL(url);
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
        var manager = this;
        var path = this.pathForURL(url);
        var parent = url.removingLastPathComponent();
        fs.unlink(path, function(error){
            if (!error){
                manager.postNotificationForURL(parent, JSFileManager.Notification.directoryDidRemoveItem, {url: url, name: url.lastPathComponent, itemType: JSFileManager.ItemType.file});
            }
            completion.call(target, error === null);
        });
    },

    _removeDirectoryAtURL: function(url, completion, target){
        var manager = this;
        var path = this.pathForURL(url);
        var parent = url.removingLastPathComponent();
        fs.readdir(path, function(error, files){
            if (error === null){
                var i = 0;
                var removeNextChild = function(){
                    if (i == files.length){
                        fs.rmdir(path, function(error){
                            if (!error){
                                manager.postNotificationForURL(parent, JSFileManager.Notification.directoryDidRemoveItem, {url: url, name: url.lastPathComponent, itemType: JSFileManager.ItemType.directory});
                            }
                            completion.call(target, error === null);
                        });
                    }else{
                        var childURL = url.appendingPathComponent(files[i]);
                        var childPath = manager.pathForURL(childURL);
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
        var path = this.pathForURL(url);
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
        var path = this.pathForURL(url);
        var manager = this;
        fs.readdir(path, {withFileTypes: true}, function(error, entries){
            if (error !== null){
                completion.call(target, null);
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
                    url: url.appendingPathComponent(entry.name, itemType == JSFileManager.ItemType.directory),
                    name: entry.name,
                    itemType: itemType
                });
            }
            completion.call(target, contents);
        });
        return completion.promise;
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
        var path = this.pathForURL(url);
        var toPath = this.pathForURL(toURL);
        var parent = url.removingLastPathComponent();
        var manager = this;
        fs.symlink(toPath, path, function(error){
            if (!error){
                manager.postNotificationForURL(parent, JSFileManager.Notification.directoryDidAddItem, {url: url, name: url.lastPathComponent, itemType: JSFileManager.ItemType.symbolicLink});
            }
            completion.call(target, error === null);
        });
        return completion.promise;
    },

    destinationOfSymbolicLinkAtURL: function(url, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var path = this.pathForURL(url);
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
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        var manager = this;
        var rootPath = this.pathForURL(this._rootURL);
        fs.stat(rootPath, function(error, stat){
            if (error === null){
                manager._removeItemAtURL(manager._rootURL, stat, function(success){
                    completion.call(target, success);
                });
            }else{
                completion.call(target, true);
            }
        });
        return completion.promise;
    },

});

JSFileManager.ItemType.fromStat = function(stat){
    if (stat.isSymbolicLink()){
        return JSFileManager.ItemType.symbolicLink;
    }
    if (stat.isDirectory()){
        return JSFileManager.ItemType.directory;
    }
    if (stat.isFile()){
        return JSFileManager.ItemType.file;
    }
    return JSFileManager.ItemType.other;
};
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

    _rootPath: null,

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
        this._rootPath = pathLib.join(process.cwd(), 'io.breakside.jskit.JSFileManager');
        completion.call(target, JSFileManager.State.success);
        return completion.promise;
    },

    // --------------------------------------------------------------------
    // MARK: - Common Directories

    _getTemporaryDirectoryURL: function(){
        return this.persistentContainerURL.appendingPathComponent("Temp");
    },

    _getPersistentContainerURL: function(){
        return JSURL.initWithString('%s://%s/Containers/%s'.sprintf(JSFileManager.Scheme.file, this._rootPath, JSBundle.mainBundleIdentifier));
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
        fs.stat(url.path, function(error, stats){
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
        return completion.promise;
    },

    // --------------------------------------------------------------------
    // MARK: - Creating Folders

    createFolderAtURL: function(url, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
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
        return completion.promise;
    },

    _createFolderWithAncestorsAtURL: function(url, completion){
        var parent = url.removingLastPathComponent();
        var manager = this;
        var create = function(parentError){
            if (parentError === null){
                fs.mkdir(url.path, function(error){
                    completion(error);
                });
            }else{
                completion(parentError);
            }
        };
        if (parent.pathComponents.length === 0){
            completion(new Error("Parent has no path"));
        }else{
            fs.stat(parent.path, function(error, stat){
                if (error === null){
                    create(stat.isDirectory() ? null : new Error("Parent is not a directory"));
                }else{
                    manager._createFolderWithAncestorsAtURL(parent, create);
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
                fs.writeFile(url.path, data, function(error){
                    completion.call(target, error === null);
                });
            }else{
                completion.call(target, false);
            }
        };
        fs.stat(parent.path, function(error, stat){
            if (error === null){
                create(stat.isDirectory());
            }else{
                manager._createFolderWithAncestorsAtURL(parent, function(error){
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
        fs.stat(url.path, function(error, stat){
            var move = function(toParentExists){
                if (toParentExists){
                    fs.rename(url.path, toURL.path, function(error){
                        completion.call(target, error === null);
                    });
                }else{
                    completion.call(target, false);
                }
            };
            if (error === null){
                move(stat.isDirectory());
            }else{
                manager._createFolderWithAncestorsAtURL(toParent, function(error){
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
        fs.stat(url.path, function(error, stat){
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
                manager._createFolderWithAncestorsAtURL(toParent, function(error){
                    copy(error === null);
                });
            }
        });
        return completion.promise;
    },

    _copyItemAtURL: function(url, toURL, stat, completion, target){
        if (stat.isDirectory()){
            this._copyFolderAtURL(url, toURL, completion, target);
        }else{
            this._copyFileAtURL(url, toURL, completion, target);
        }
    },

    _copyFileAtURL: function(url, toURL, completion, target){
        fs.copy(url, toURL, function(error){
            completion.call(target, error === null);
        });
    },

    _copyFolderAtURL: function(url, toURL, completion, target){
        var manager = this;
        fs.mkdir(toURL.path, function(error){
            if (error === null){
                fs.readdir(url.path, function(error, files){
                    var i = 0;
                    var copyNextChild = function(){
                        if (i === files.length){
                            completion.call(target, true);
                        }else{
                            var childURL = url.appendingPathComponent(files[i]);
                            var toChildURL = toURL.appendingPathComponent(files[i]);
                            fs.stat(childURL.path, function(error, stat){
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
        fs.lstat(url.path, function(error, stats){
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
            this._removeFolderAtURL(url, completion, target);
        }else{
            this._removeFileAtURL(url, completion, target);
        }
    },

    _removeFileAtURL: function(url, completion, target){
        fs.unlink(url.path, function(error){
            completion.call(target, error === null);
        });
    },

    _removeFolderAtURL: function(url, completion, target){
        var manager = this;
        fs.readdir(url.path, function(error, files){
            if (error === null){
                var i = 0;
                var removeNextChild = function(){
                    if (i == files.length){
                        fs.rmdir(url.path, function(error){
                            completion.call(target, error === null);
                        });
                    }else{
                        var childURL = url.appendingPathComponent(files[i]);
                        fs.lstat(childURL.path, function(error, stat){
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
        fs.readFile(url.path, function(error, buffer){
            if (error === null){
                completion.call(target, JSData.initWithNodeBuffer(buffer));
            }else{
                completion.call(target, null);
            }
        });
        return completion.promise;
    },

    // --------------------------------------------------------------------
    // MARK: - Symbolic Links

    createSymbolicLinkAtURL: function(url, toURL, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        if (!url.isAbsolute){
            logger.warn("relative URL passed to createSymbolicLinkAtURL");
        }
        if (!toURL.isAbsolute){
            logger.warn("relative URL passed to createSymbolicLinkAtURL");
        }
        if (url.scheme != JSFileManager.Scheme.file){
            throw new Error("JSFileManager.createSymbolicLinkAtURL unsupported scheme: %s".sprintf(url.scheme));
        }
        if (toURL.scheme != JSFileManager.Scheme.file){
            throw new Error("JSFileManager.createSymbolicLinkAtURL unsupported scheme: %s".sprintf(toURL.scheme));
        }
        if (url.path == toURL.path){
            throw new Error("JSFileManager.createSymbolicLinkAtURL target and destination are the same");
        }
        fs.symlink(toURL.path, url.path, function(error){
            if (error !== null){
                debugger;
            }
            completion.call(target, error === null);
        });
        return completion.promise;
    },

    // --------------------------------------------------------------------
    // MARK: - Destorying the File Manager

    destroy: function(completion, target){
        var manager = this;
        fs.stat(manager._rootPath, function(error, stat){
            if (error === null){
                manager._removeItemAtURL(JSURL.initWithString("%s://%s".sprintf(JSFileManager.Scheme.file, manager._rootPath)), stat, function(success){
                    completion.call(target, success);
                });
            }else{
                completion.call(target, true);
            }
        });
    },

});
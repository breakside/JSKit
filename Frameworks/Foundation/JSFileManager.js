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

// #import "JSURL.js"
// #import "JSObject.js"
'use strict';

JSClass("JSFileManager", JSObject, {

    // --------------------------------------------------------------------
    // MARK: - Opening the File System

    open: function(completion, target){
    },

    // --------------------------------------------------------------------
    // MARK: - Common Directories

    temporaryDirectoryURL: JSLazyInitProperty('_getTemporaryDirectoryURL'),
    persistentContainerURL: JSLazyInitProperty('_getPersistentContainerURL'),

    // --------------------------------------------------------------------
    // MARK: - Paths to URLs

    urlForPath: function(path, baseURL, isDirectory){
    },

    pathForURL: function(url){
    },

    relativePathFromURL: function(url, toURL){
        var relative = toURL.encodedStringRelativeTo(url);
        var relativeURL = JSURL.initWithString(relative);
        return this.pathForURL(relativeURL);
    },

    isFileURL: function(url){
        return url.scheme === JSFileManager.Scheme.file;
    },

    // --------------------------------------------------------------------
    // MARK: - Checking for Items

    itemExistsAtURL: function(url, completion, target){
    },

    attributesOfItemAtURL: function(url, completion, target){
    },

    // --------------------------------------------------------------------
    // MARK: - Creating Directories

    createDirectoryAtURL: function(url, completion, target){
    },

    // --------------------------------------------------------------------
    // MARK: - Creating Files

    createFileAtURL: function(url, data, completion, target){
    },

    // --------------------------------------------------------------------
    // MARK: - Permissions

    makeExecutableAtURL: function(url, data, completion, target){
        completion.call(target, true);
    },

    // --------------------------------------------------------------------
    // MARK: - Moving & Copying Items

    moveItemAtURL: function(url, toURL, completion, target){
    },

    copyItemAtURL: function(url, toURL, completion, target){
    },

    // --------------------------------------------------------------------
    // MARK: - Removing Items

    removeItemAtURL: function(url, completion, target){
    },

    // --------------------------------------------------------------------
    // MARK: - File Contents

    contentsAtURL: function(url, completion, target){
    },

    // --------------------------------------------------------------------
    // MARK: - Directory Contents

    contentsOfDirectoryAtURL: function(url, completion, target){
    },

    // --------------------------------------------------------------------
    // MARK: - Symbolic Links

    createSymbolicLinkAtURL: function(url, toURL, completion, target){
    },

    createLinkAtURL: function(url, toURL){
    },

    destinationOfSymbolicLinkAtURL: function(url, completion, target){
    },

    // --------------------------------------------------------------------
    // MARK: - Destorying the File Manager

    destroy: function(completion, target){
    },

    // --------------------------------------------------------------------
    // MARK: - Timestamps

    timestamp: JSReadOnlyProperty(),

    getTimestamp: function(){
        return Math.floor((new Date()).getTime());
    }

});

Object.defineProperty(JSFileManager, 'shared', {
    configurable: true,
    get: function JSFileManager_getShared(){
        var shared = JSFileManager.initWithIdentifier("io.breakside.JSKit.Foundation.JSFileManager");
        Object.defineProperty(JSFileManager, 'shared', {value: shared});
        return shared;
    }
});

JSFileManager.State = {
    success: 0,
    genericFailure: 1,
    conflictingVersions: 2
};

JSFileManager.ItemType = {
    directory: 0,
    file: 1,
    symbolicLink: 2,
    other: 3
};

JSFileManager.Scheme = {
    jskitfile: 'io.breakside.jskit.file',
    file: 'file',
    http: 'http',
    https: 'https',
    blob: 'blob'
};
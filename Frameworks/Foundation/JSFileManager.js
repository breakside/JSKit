// Copyright 2020 Breakside Inc.
//
// Licen sed under the Breakside Public License, Version 1.0 (the "License");
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
// #import "JSNotificationCenter.js"
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
    // MARK: - Item Attributes & State

    itemExistsAtURL: function(url, completion, target){
    },

    attributesOfItemAtURL: function(url, completion, target){
    },

    stateOfItemAtURL: function(url){
        if (this._statesByURL === null){
            this._statesByURL = {};
        }
        var key = url.encodedString;
        var state = this._statesByURL[key];
        if (!state){
            state = this._statesByURL[key] = {
                downloading: false,
                uploading: false,
                downloadedPercent: null,
                uploadedPercent: null
            };
        }
        return state;
    },

    _statesByURL: null,

    _cleanupStateForURL: function(url){
        var key = url.encodedString;
        var state = this._statesByURL[url];
        if (!state.downloading && !state.uploading){
            delete this._statesByURL[url];
        }
    },

    _beginDownloadingItemAtURL: function(url){
        var state = this.stateOfItemAtURL(url);
        state.downloading = true;
        state.downloadedPercent = 0;
        this.postNotificationForURL(url, JSFileManager.Notification.itemDidChangeState, {url: url});
    },

    _updateDownloadingProgressForItemAtURL: function(url, loaded, total){
        var state = this.stateOfItemAtURL(url);
        state.downloadedPercent = loaded / total;
        this.postNotificationForURL(url, JSFileManager.Notification.itemDidChangeState, {url: url});
    },

    _endDownloadingItemAtURL: function(url){
        var state = this.stateOfItemAtURL(url);
        state.downloading = false;
        state.downloadedPercent = null;
        this.postNotificationForURL(url, JSFileManager.Notification.itemDidChangeState, {url: url});
        this._cleanupStateForURL(url);
    },

    _beginUploadingItemAtURL: function(url, total){
        var state = this.stateOfItemAtURL(url);
        state.uploading = true;
        state.uploadedPercent = 0;
        state._uploadTotal = total;
        state._uploadProgress = 0;
        this.postNotificationForURL(url, JSFileManager.Notification.itemDidChangeState, {url: url});
        do {
            url = url.removingLastPathComponent();
            state = this.stateOfItemAtURL(url);
            if (!state.uploading){
                state.uploading = true;
                state._uploadTotal = 0;
                state._uploadProgress = 0;
            }
            state._uploadTotal += total;
            state.uploadedPercent = state._uploadProgress / state._uploadTotal;
            this.postNotificationForURL(url, JSFileManager.Notification.itemDidChangeState, {url: url});
        }while (url.pathComponents.length > 1);
    },

    _updateUploadingProgressForItemAtURL: function(url, loaded, total){
        var state = this.stateOfItemAtURL(url);
        var added = loaded - state._uploadProgress;
        if (added > 0){
            state._uploadProgress = loaded;
            state.uploadedPercent = state._uploadProgress / state._uploadTotal;
            this.postNotificationForURL(url, JSFileManager.Notification.itemDidChangeState, {url: url});
            do{
                url = url.removingLastPathComponent();
                state = this.stateOfItemAtURL(url);
                state._uploadProgress += added;
                state.uploadedPercent = state._uploadProgress / state._uploadTotal;
                this.postNotificationForURL(url, JSFileManager.Notification.itemDidChangeState, {url: url});
            }while (url.pathComponents.length > 1);
        }
    },

    _endUploadingItemAtURL: function(url){
        var state = this.stateOfItemAtURL(url);
        var added = state._uploadTotal - state._uploadProgress;
        state.uploading = false;
        state.uploadedPercent = null;
        this.postNotificationForURL(url, JSFileManager.Notification.itemDidChangeState, {url: url});
        this._cleanupStateForURL(url);
        do{
            url = url.removingLastPathComponent();
            state = this.stateOfItemAtURL(url);
            state._uploadProgress += added;
            state.uploadedPercent = state._uploadProgress / state._uploadTotal;
            if (state._uploadProgress === state._uploadTotal){
                state.uploading = false;
                this.postNotificationForURL(url, JSFileManager.Notification.itemDidChangeState, {url: url});
                this._cleanupStateForURL(url);
            }else if (added > 0){
                this.postNotificationForURL(url, JSFileManager.Notification.itemDidChangeState, {url: url});
            }
        }while (url.pathComponents.length > 1);
    },

    // --------------------------------------------------------------------
    // MARK: - Observing changes

    notificationCenter: JSLazyInitProperty("_createNotificationCenter"),

    _createNotificationCenter: function(){
        return JSNotificationCenter.init();
    },

    addObserverForURL: function(url, name, callback, target){
        return this.notificationCenter.addObserver(name, url.encodedString, callback, target);
    },

    removeObserverForURL: function(url, name, observerId){
        this.notificationCenter.removeObserver(name, observerId);
    },

    postNotificationForURL: function(url, name, userInfo){
        this.notificationCenter.post(name, url.encodedString, userInfo);
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

JSFileManager.Notification = {
    directoryDidAddItem: "JSFileManager.Notification.directoryDidAddItem",
    directoryDidRemoveItem: "JSFileManager.Notification.directoryDidRemoveItem",
    itemDidChangeState: "JSFileManager.Notification.itemDidChangeState"
};

JSFileManager.compareItemsByNameDirectoriesFirst = function(a, b){
    if (a.itemType === JSFileManager.ItemType.directory && b.itemType !== JSFileManager.ItemType.directory){
        return -1;
    }
    if (a.itemType !== JSFileManager.ItemType.directory && b.itemType === JSFileManager.ItemType.directory){
        return 1;
    }
    return a.name.localeCompare(b.name);
};
// #import "Foundation/JSObject.js"
/* global JSClass, JSObject, JSLazyInitProperty, JSReadOnlyProperty, JSFileManager */
'use strict';

JSClass("JSFileManager", JSObject, {

    // --------------------------------------------------------------------
    // MARK: - Creating a File Manager

    initWithIdentifier: function(identifier){
        this._identifier = identifier;
    },

    _identifier: null,

    // --------------------------------------------------------------------
    // MARK: - Opening the File System

    open: function(completion, target){
    },

    // --------------------------------------------------------------------
    // MARK: - Common Directories

    temporaryDirectoryURL: JSLazyInitProperty('_getTemporaryDirectoryURL'),
    persistentContainerURL: JSLazyInitProperty('_getPersistentContainerURL'),

    // --------------------------------------------------------------------
    // MARK: - Checking for Items

    itemExistsAtURL: function(url, completion, target){
    },

    attributesOfItemAtURL: function(url, completion, target){
    },

    // --------------------------------------------------------------------
    // MARK: - Creating Folders

    createFolderAtURL: function(url, data, completion, target){
    },

    // --------------------------------------------------------------------
    // MARK: - Creating Files

    createFileAtURL: function(url, data, completion, target){
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
    // MARK: - Symbolic Links

    createSymbolicLinkAtURL: function(url, toURL, completion, target){
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
    folder: 0,
    file: 1,
    symbolicLink: 2,
    other: 3
};
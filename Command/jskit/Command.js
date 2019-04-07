// #import Foundation
// #import jsyaml
/* global JSClass, JSObject, JSDynamicProperty, Command, JSURL, JSFileManager, process */
'use strict';

JSClass("Command", JSObject, {

    // -----------------------------------------------------------------------
    // MARK: - Command Name & Options

    name: null,
    options: null,
    help: null,

    // -----------------------------------------------------------------------
    // MARK: - Creating a Command

    initWithName: function(name, workingDirectory){
        var subclass = Command.byName[name];
        if (subclass){
            return subclass.initInWorkingDirectory(workingDirectory);
        }
        return null;
    },

    initInWorkingDirectory: function(workingDirectory){
        this.fileManager = JSFileManager.shared;
        this.workingDirectoryURL = this.fileManager.urlForPath(workingDirectory);
        this.workingDirectoryURL.hasDirectoryPath = true;
    },

    // -----------------------------------------------------------------------
    // MARK: - Environment

    fileManager: null,
    workingDirectoryURL: null,
    arguments: null,

    returnValue: JSDynamicProperty(),

    getReturnValue: function(){
        return process.exitCode;
    },

    setReturnValue: function(value){
        process.exitCode = value;
    },

    // -----------------------------------------------------------------------
    // MARK: - Running a command

    run: function(){
    },

});

Command.names = [];
Command.byName = {};

Command.$extend = function(extensions, name){
    var subclass = JSClass.prototype.$extend.call(this, extensions, name);
    this.names.push(extensions.name);
    this.byName[extensions.name] = subclass;
    return subclass;
};
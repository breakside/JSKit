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
        this.workingDirectoryURL = this.fileManager.urlForPath(workingDirectory, null, true);
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

    inputData: async function(){
        return new Promise(function(resolve, reject){
            let chunks = [];
            process.stdin.on('readable', function(){
                let chunk = process.stdin.read();
                while (chunk !== null){
                    chunks.push(JSData.initWithNodeBuffer(chunk));
                    chunk = process.stdin.read();
                }
            });
            process.stdin.on('end', function(){
                resolve(JSData.initWithChunks(chunks));
            });
            process.stdin.on('error', function(e){
                reject(e);
            });
        });
    }

});

Command.names = [];
Command.byName = {};

Command.$extend = function(extensions, name){
    var subclass = JSClass.prototype.$extend.call(this, extensions, name);
    this.names.push(extensions.name);
    this.byName[extensions.name] = subclass;
    return subclass;
};
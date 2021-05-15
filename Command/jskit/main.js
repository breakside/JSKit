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
// #import "InitCommand.js"
// #import "MakeCommand.js"
// #import "AddCommand.js"
// #import "TestCommand.js"
// #import "DocCommand.js"
// #import "GlobalsCommand.js"
'use strict';

var options = {
    help:    {kind: "flag", shortcut: "h", hidden: true},
    command: {kind: "positional", subcommand: true, help: "The jskit sub-command to run", allowed: Command.names},
    subargs: {kind: "unknown", help: "Additional arguments for the sub-command"}
};

module.exports.main = async function(){
    var args = JSArguments.initWithOptions(options);
    var argv = process.argv.slice(1);
    try{
        args.parse(argv);
    }catch (e){
        process.stderr.write(e.toString());
        process.stderr.write("\n\n");
        process.stderr.write(args.helpString());
        process.exitCode = -1;
        return;
    }
    if (args.help){
        process.stdout.write(args.helpString());
        process.exitCode = 0;
        return;
    }
    var workingDirectory = process.cwd();
    var command = Command.initWithName(args.command, workingDirectory);
    var commandArgv = [args._commandName + ' ' + args.command].concat(args.subargs);
    var commandOptions = JSCopy(command.options);
    commandOptions.help = {kind: "flag", shortcut: "h", hidden: true};
    command.arguments = JSArguments.initWithOptions(commandOptions);
    try{
        command.arguments.parse(commandArgv);
    }catch (e){
        process.stderr.write(e.toString());
        process.stderr.write("\n\n");
        process.stderr.write(command.arguments.helpString());
        process.exitCode = -1;
        return;
    }
    if (command.arguments.help){
        process.stdout.write(command.arguments.helpString());
        process.exitCode = 0;
        return;
    }
    try {
        await command.run();
    }catch (e){
        process.stderr.write("\n");
        if (e){
            if (e.stack){
                process.stderr.write(e.stack + "\n");
            }else{
                process.stderr.write(e.toString() + "\n");
            }
        }else{
            process.stderr.write("(No error information)\n");
        }
        process.exitCode = -1;
    }
};
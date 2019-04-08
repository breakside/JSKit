// #import Foundation
// #import "InitCommand.js"
// #import "MakeCommand.js"
// #import "AddCommand.js"
// #import "TestCommand.js"
/* global module, require, process, JSArguments, JSCopy, Command */
'use strict';

var options = {
    help:    {kind: "flag", shortcut: "h", hidden: true},
    command: {kind: "positional", help: "The jskit sub-command to run", allowed: Command.names},
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
    command.arguments = JSArguments.initWithOptions(command.options);
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
        process.stdout.write("\n\n");
        process.stdout.write(args.helpString());
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
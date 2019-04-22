// #import "JSFormFieldMap.js"
/* global JSClass, JSObject, JSFormFieldMap */
'use strict';

(function(){

JSClass("JSArguments", JSObject, {

    _options: null,
    _commandName: null,

    initWithOptions: function(options){
        this._options = options;
        var name;
        var option;
        for (name in this._options){
            option = this._options[name];
            if ('default' in option){
                Object.defineProperty(this, name, {configurable: true, value: option.default, writable: option.default === null});
            }else if (option.multiple || option.kind == "unknown"){
                Object.defineProperty(this, name, {configurable: true, value: []});
            }else if (option.kind == "flag"){
                Object.defineProperty(this, name, {configurable: true, value: false});
            }
        }
    },

    parse: function(argv){
        var i = 0;
        var l = argv.length;
        if (l > 0){
            this._commandName = argv[i++];
            if (this._commandName && this._commandName !== '/'){
                if (this._commandName.charAt(this._commandName.length - 1) == '/'){
                    this._commandName = this._commandName.substr(0, this._commandName.length - 1);
                }
                var slashIndex = this._commandName.lastIndexOf('/');
                if (slashIndex >= 0){
                    this._commandName = this._commandName.substr(slashIndex + 1);
                }
            }
        }
        var positionalNameIndex = 0;
        var positionalNames = [];
        var name;
        var option;
        var shortcuts = {};
        var finalPositionalName = null;
        var unknownName = null;
        for (name in this._options){
            option = this._options[name];
            if (option.kind == "positional"){
                positionalNames.push(name);
                if (finalPositionalName !== null){
                    throw new Error("Only the final positional option can have multiple values");
                }
                if (option.multiple){
                    finalPositionalName = name;
                }
            }else if (option.kind == "unknown"){
                if (unknownName !== null){
                    throw new Error("Only one option may be used for unknown arguments");
                }
                Object.defineProperty(this, name, {value: []});
                unknownName = name;
            }
            if (option.shortcut){
                shortcuts[option.shortcut] = name;
            }
        }
        name = null;
        var value = null;
        var arg;
        var positional = false;
        var hasUnknown = false;
        var written = {};
        for (; i < argv.length; ++i){
            arg = argv[i];
            // Once we've seen an unknown arg, everything after is considered to be unknown
            if (hasUnknown){
                this[unknownName].push(arg);

            // If we see an arg that starts with a - it could be
            // - just a -, in which case we treat it as a value
            // - a negative number, in which case we treat it as a value
            // - a shortcut option name like -o
            // - a full option name like --option
            // - the special -- arg, which changes to positional mode
            //
            // Only check for option names if we're not in positional mode, otherwise
            // treat all options as values for positional arguments.
            }else if (!positional && arg.length > 1 && arg.charAt(0) == '-' && !arg.match(/^\-\d+$/)){
                // If we have what looks like an option name, but we're waiting for a value
                // for the previous option, it's an error.
                if (name !== null){
                    throw Error("Missing value for option: %s".sprintf(name));
                }

                if (arg.charAt(1) == '-'){
                    // -- or --option
                    if (arg.length == 2){
                        positional = true;
                    }else{
                        name = arg.substr(2);
                    }
                }else{
                    // -o shortcut
                    name = arg.substr(1);
                    if (name in shortcuts){
                        name = shortcuts[name];
                    }else{
                        name = null;
                    }
                }

                // If we haven't switched modes, see if we know about the
                // option name.  (If we have switched modes, name and value
                // are null, so the remainder of the loop iteration does nothing).
                if (!positional){
                    option = name !== null ? this._options[name] : null;
                    if (!option || option.kind == "positional"){
                        // If we don't have a name, or don't know about the name,
                        // or if the name matches a positional option, treat
                        // it as an unknown option because a valid name wasn't given
                        if (unknownName !== null){
                            this[unknownName].push(arg);
                            hasUnknown = true;
                            name = null;
                            value = null;
                        }else{
                            throw Error("Unknown option: %s".sprintf(arg));
                        }
                    }else if (option.kind == "flag"){
                        // Flag options don't have following values, they simply
                        // set their value to true
                        value = true;
                    }else{
                        // Non-flag options expect a value to follow.
                        // (value should already be null in this case, so
                        // there's nothing left to do)
                    }
                }

            // If the arg doesn't look like a name, or if we're in positional
            // mode, treat the arg as a value
            }else{
                value = arg;
            }

            // If we have a value, go about setting it
            if (value !== null){
                // If we don't have an option name, then see if we have a positional
                // option to use.
                if (name === null){
                    name = positionalNameIndex < positionalNames.length ? positionalNames[positionalNameIndex++] : finalPositionalName;
                }
                if (name === null){
                    // If we still don't have name, it's an unknown argument
                    if (unknownName !== null){
                        this[unknownName].push(arg);
                        hasUnknown = true;
                        value = null;
                    }else{
                        throw new Error("Got a positional arg, but no option for it");
                    }
                }else{
                    // If we do have a name, set the value
                    option = this._options[name];

                    // Parse the value according to the valueType
                    if (option.valueType == "integer"){
                        value = parseInt(value);
                        if (isNaN(value)){
                            throw new Error("Option must be an integer: %s");
                        }
                    }

                    if (option.multiple){
                        // Add to an array for multiple valued options
                        this[name].push(value);
                    }else{
                        // Set the value for single valued option, but it's
                        // an error if we've already set the value for the option.
                        if (name in written){
                            throw new Error("Option cannot be used multiple times: %s".sprintf(name));
                        }
                        written[name] = true;
                        Object.defineProperty(this, name, {value: value});
                    }
                    name = null;
                    value = null;
                }
            }
        }

        for (name in this._options){
            option = this._options[name];
            if (!('default' in option) && option.kind != "flag"){
                if (option.multiple){
                    if (this[name].length === 0){
                        throw Error("Missing required argument: %s".sprintf(name));
                    }
                }else{
                    if (!(name in this)){
                        throw Error("Missing required argument: %s".sprintf(name));
                    }
                }
            }
            if ('allowed' in option){
                if (option.multiple){
                    for (i = 0, l = this[name].length; i < l; ++i){
                        if (option.allowed.indexOf(this[name][i]) < 0){
                            throw new Error("Invalid value for %s: %s".sprintf(name, this[name][i]));
                        }
                    }
                }else{
                    if (option.allowed.indexOf(this[name]) < 0){
                        throw new Error("Invalid value for %s: %s".sprintf(name, this[name]));
                    }
                }
            }
        }
    },

    parseQueryString: function(query, positional){
        if (query.length > 0 && query.charAt(0) == '?'){
            query = query.substr(1);
        }
        var map = JSFormFieldMap();
        map.decode(query.utf8(), true);
        var argv = [null];
        var field;
        var i, l;
        for (i = 0, l = map.fields.length; i < l; ++i){
            field = map.fields[i];
            argv.push('--' + field.name);
            if (field.value !== null){
                argv.push(field.value);
            }
        }
        if (positional){
            for (i = 0, l = positional.length; i < l; ++i){
                argv.push(positional[i]);
            }
        }
        this.parse(argv);
    },

    helpString: function(){
        var lines = [];
        var command = ["Usage:"];
        if (this._commandName){
            command.push(this._commandName);
        }
        var names = [];
        var options = [];
        var option;
        var arg;
        for (var name in this._options){
            option = this._options[name];
            if (option.hidden){
                continue;
            }
            options.push(option);
            if (option.kind == "positional"){
                names.push(name);
                if (option.default !== undefined){
                    if (option.multiple){
                        command.push("[%s1 ...]".sprintf(name));
                    }else{
                        command.push("[%s]".sprintf(name));
                    }
                }else{
                    if (option.multiple){
                        command.push("%s1".sprintf(name));
                        command.push("[%s2 ...]".sprintf(name));
                    }else{
                        command.push(name);
                    }
                }
            }else if (option.kind == "unknown"){
                command.push("...");
                names.push("...");
            }else{
                if (option.shortcut){
                    arg = "-%s".sprintf(option.shortcut);
                    names.push("-%s, --%s".sprintf(option.shortcut, name));
                }else{
                    arg = "--%s".sprintf(name);
                    names.push(arg);
                }
                if (option.kind == "flag"){
                    command.push("[%s]".sprintf(arg));
                }else{
                    if (option.default !== undefined){
                        command.push("[%s %s]".sprintf(arg, option.valueName || name));
                    }else{
                        command.push("%s %s".sprintf(arg, option.valueName || name));
                    }
                }
            }
        }
        lines.push(command.join(" "));
        lines.push("");
        var i, l;
        var width = 0;
        for (i = 0, l = names.length; i < l; ++i){
            name = names[i];
            if (name.length > width){
                width = name.length;
            }
        }
        var format = "  %%-%ds    %%s".sprintf(width);
        var indent = format.sprintf("", "");
        for (i = 0, l = names.length; i < l; ++i){
            name = names[i];
            option = options[i];
            lines.push(format.sprintf(name, option.help || ''));
            if (option.default !== undefined && option.default !== null){
                lines.push(indent + "(default: %s)".sprintf(option.default));
            }
            if (option.allowed){
                lines.push(indent + "one of:");
                for (var j = 0, k = option.allowed.length; j < k; ++j){
                    lines.push(indent + "  %s".sprintf(option.allowed[j]));
                }
            }
        }

        for (i = 0, l = lines.length; i < l; ++i){
            lines[i] = wrapLine(lines[i], 79, indent);
        }

        lines.push("");

        return lines.join("\n");
    }

});

var wrapLine = function(line, maxLength, indent){
    if (line.length <= maxLength){
        return line;
    }
    var i = maxLength;
    var lines = [];
    maxLength -= indent.length;
    while (i >= 0){
        if (line.charCodeAt(i) == 0x20){
            lines.push(line.substr(0, i));
            line = line.substr(i + 1);
            if (line.length <= maxLength){
                i = -1;
            }else{
                i = maxLength;
            }
        }else{
            --i;
        }
    }
    if (i === -1 && line.length > 0){
        lines.push(line);
    }
    return lines.join("\n" + indent);
};

})();
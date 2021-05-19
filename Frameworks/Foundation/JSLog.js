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

/* global console, require */
'use strict';

(function(){

var performance = JSGlobalObject.performance;

if (!performance){
    performance = require('perf_hooks').performance;
}

var JSLogBuffer = function(capacity){
    if (this === undefined){
        return new JSLogBuffer(capacity);
    }
    this.capacity = capacity;
    this.array = new Array(capacity);
};

JSLogBuffer.prototype = {
    writeIndex: 0,
    length: 0,

    write: function(record){
        this.array[this.writeIndex] = record;
        if (this.length < this.capacity){
            this.length += 1;
        }
        this.writeIndex = (this.writeIndex + 1) % this.capacity;
    },

    readAll: function(){
        var records = [];
        if (this.length < this.capacity){
            return this.array.slice(0, this.length);
        }
        return this.array.slice(this.writeIndex).concat(this.array.slice(0, this.writeIndex));
    }
};

JSGlobalObject.JSLog = function(subsystem, category, suffix){
    if (this === undefined){
        return new JSLog(subsystem, category, suffix);
    }
    if (subsystem === undefined || subsystem === null || subsystem === JSLog.any){
        throw new Error("JSLog() requires a subsystem");
    }
    if (category === undefined || category === null || category === JSLog.any){
        throw new Error("JSLog() requires a category");
    }
    this.subsystem = subsystem;
    this.category = category;
    this.config = JSLog.getOrCreateConfig(subsystem, category);
    if (suffix !== undefined){
        this.category += suffix;
        var handlers = this.config.handlers;
        this.config = createConfiguration(this.config);
        this.config.handlers = handlers;
    }
};

JSLog.any = '__any__';

var defaultConfiguration = {
    enabled: true,
    print: true,
    console: console,
    handlers: null,
    parent: null
};

var createConfiguration = function(parent){
    return Object.create({}, {
        debug:  {value: Object.create(parent.debug, {handlers: {value: []}, parent: {value: parent.debug}})},
        info:   {value: Object.create(parent.info,  {handlers: {value: []}, parent: {value: parent.info}})},
        log:    {value: Object.create(parent.log,   {handlers: {value: []}, parent: {value: parent.log}})},
        warn:   {value: Object.create(parent.warn,  {handlers: {value: []}, parent: {value: parent.warn}})},
        error:  {value: Object.create(parent.error, {handlers: {value: []}, parent: {value: parent.error}})},
    });
};

JSLog.configuration = {};
JSLog.configuration[JSLog.any] = {};
JSLog._rootConfiguration = JSLog.configuration[JSLog.any][JSLog.any] = Object.create({}, {
    debug:  {value: Object.create(defaultConfiguration, {handlers: {value: []}})},
    info:   {value: Object.create(defaultConfiguration, {handlers: {value: []}})},
    log:    {value: Object.create(defaultConfiguration, {handlers: {value: []}})},
    warn:   {value: Object.create(defaultConfiguration, {handlers: {value: []}})},
    error:  {value: Object.create(defaultConfiguration, {handlers: {value: []}})},
});

JSLog.getOrCreateConfig = function(subsystem, category){
    subsystem = subsystem || JSLog.any;
    category = category || JSLog.any;
    var parent = JSLog._rootConfiguration;
    if (subsystem === JSLog.any){
        return parent;
    }
    var level;
    var subsystemConfig = JSLog.configuration[subsystem];
    if (!subsystemConfig){
        JSLog.configuration[subsystem] = subsystemConfig = {};
        subsystemConfig[JSLog.any] = createConfiguration(parent);
    }
    parent = subsystemConfig[JSLog.any];
    if (category === JSLog.any){
        return parent;
    }
    var config = subsystemConfig[category];
    if (!config){
        config = subsystemConfig[category] = createConfiguration(parent);
    }
    return config;
};

JSLog.configure = function(configuration, level, subsystem, category){
    var config = JSLog.getOrCreateConfig(subsystem, category);
    for (var property in configuration){
        if (property === 'enabled' || property === 'print' || property === 'console'){
            config[level][property] = configuration[property];
        }
    }
};

JSLog.addHandler = function(handler, level, subsystem, category){
    var config = JSLog.getOrCreateConfig(subsystem, category);
    if (typeof(handler) === 'function'){
        handler = {handleLog: handler};
    }
    config[level].handlers.push(handler);
};

JSLog.formatted = function(records){
    if (!(records instanceof Array)){
        records = [records];
    }
    var formatted = [];
    for (var i = 0, l = records.length; i < l; ++i){
        formatted.push(JSLog.format(records[i]));
    }
    return formatted;
};

JSLog.format = function(record){
    var args = [
        record.timestamp,
        record.level,
        record.subsystem.length <= 16 ? record.subsystem : (record.subsystem.substr(0, 13) + '...'),
        record.category.length <= 20 ? record.category : (record.category.substr(0, 17) + '...')
    ];
    var format = "%t %-5{public} %-16{public} %-20{public} " + record.message;
    return format.format(jslog_formatter, args.concat(record.args));
};

JSLog.formatMessage = function(message, args){
    return message.format(jslog_formatter, args);
};

JSLog.formatStacktrace = function(record){
    var stack = null;
    for (var i = 0, l = record.args.length; i < l && stack === null; ++i){
        if (record.args[i] instanceof Error){
            stack = record.args[i].stack;
        }
    }
    if (stack){
        var lines = stack.split("\n");
        lines.unshift("");
        return lines.join("\n                                                             ");
    }
    return "";
};

var isCallingHandlers = false;

JSLog.write = function(record){
    JSLog.buffer.write(record);
};

JSLog.getRecords = function(){
    return this.buffer.readAll();
};

JSLog.dump = function(){
    var records = JSLog.getRecords();
    var record;
    for (var i = 0, l = records.length; i < l; ++i){
        record = records[i];
        console[record.level](JSLog.format(record));
    }
};

JSLog._createBuffer = function(capacity){
    return new JSLogBuffer(capacity);
};

JSLog.buffer = JSLogBuffer(200);

var jslog_formatter = {

    flag_map: {
        "'": 'thousands',
        '-': 'left_justified',
        '+': 'signed',
        '#': 'alternate',
        '0': 'zero'
    },

    d: String.printf_formatter.d,
    x: String.printf_formatter.x,
    X: String.printf_formatter.X,
    f: String.printf_formatter.f,
    b: String.printf_formatter.b,

    t: function(timestamp, options){
        var s = Math.floor(timestamp);
        var ms = Math.round((timestamp - s) * 1000);
        if (ms === 1000){
            s += 1;
            ms = 0;            
        }
        return s.toString().leftPaddedString('0', 10) + '.' + ms.toString().leftPaddedString('0', 3);
    },

    error: function(e, options){
        // var frames = e.frames;
        // return e.toString() + ' \u2014 ' + frames[0].method + ' \u2014 ' + frames[0].filename + ':' + frames[0].lineno;
        return e.toString();
    },

    public: String.printf_formatter.s
};

JSLog.prototype = {

    debug: function(message){
        this.write(JSLog.Level.debug, message, Array.prototype.slice.call(arguments, 1));
    },

    info: function(message){
        this.write(JSLog.Level.info, message, Array.prototype.slice.call(arguments, 1));
    },

    log: function(message){
        this.write(JSLog.Level.log, message, Array.prototype.slice.call(arguments, 1));
    },

    warn: function(message){
        if (message instanceof Error){
            this.write(JSLog.Level.warn, "%{error}", [message]);
        }else{
            this.write(JSLog.Level.warn, message, Array.prototype.slice.call(arguments, 1));
        }
    },

    error: function(message){
        if (message instanceof Error){
            this.write(JSLog.Level.error, "%{error}", [message]);
        }else{
            this.write(JSLog.Level.error, message, Array.prototype.slice.call(arguments, 1));
        }
    },

    multiline: function(level, message){
        var lines = message.split("\n");
        for (var i = 0, l = lines.length; i < l; ++i){
            this.write(level, lines[i], []);
        }
    },

    mark: function(name, level){
        if (this.write(level !== undefined ? level : JSLog.Level.log, "---- %{public}", [name])){
            performance.mark(name);
        }
    },

    write: function(level, message, args){
        var config = this.config[level];
        if (!config.enabled){
            return false;
        }
        var record = {
            subsystem: this.subsystem,
            category: this.category,
            level: level,
            message: message,
            args: args,
            timestamp: Date.now() / 1000
        };
        JSLog.write(record);
        if (config.print){
            config.console[record.level](JSLog.format(record) + JSLog.formatStacktrace(record));
        }
        if (!isCallingHandlers){
            isCallingHandlers = true;
            var handler;
            var i, l;
            if (config.parent){
                if (config.parent.parent){
                    for (i = 0, l = config.parent.parent.handlers.length; i < l; ++i){
                        handler = config.parent.parent.handlers[i];
                        handler.handleLog(record);
                    }
                }
                for (i = 0, l = config.parent.handlers.length; i < l; ++i){
                    handler = config.parent.handlers[i];
                    handler.handleLog(record);
                }
            }
            for (i = 0, l = config.handlers.length; i < l; ++i){
                handler = config.handlers[i];
                handler.handleLog(record);
            }
            isCallingHandlers = false;
        }
        return true;
    }

};

JSLog.Level = {
    debug: 'debug',
    info: 'info',
    log: 'log',
    warn: 'warn',
    error: 'error'
};

})();
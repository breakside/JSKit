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
    readIndex: 0,
    writeIndex: 0,
    length: 0,

    write: function(record){
        this.array[this.writeIndex] = record;
        if (this.length < this.capacity){
            this.length += 1;
        }
        this.writeIndex = (this.writeIndex + 1) % this.capacity;
        if (this.writeIndex === this.readIndex){
            this.readIndex = (this.readIndex + 1) % this.capacity;
        }
    },

    readAll: function(){
        var records = [];
        if (this.length < this.capacity){
            return this.array.slice(0, this.length);
        }
        return this.array.slice(this.writeIndex, this.capacity - this.writeIndex).concat(this.array.slice(this.writeIndex));
    }
};

JSGlobalObject.JSLog = function(subsystem, category){
    if (this === undefined){
        return new JSLog(subsystem, category);
    }
    this.subsystem = subsystem;
    this.category = category;
    this.config = JSLog.getOrCreateConfig(subsystem, category);
};

JSLog.configuration = {};

JSLog.getOrCreateConfig = function(subsystem, category){
    subsystem = subsystem || '__any__';
    category = category || '__any__';
    if (!(subsystem in JSLog.configuration)){
        JSLog.configuration[subsystem] = {'__any__': Object.create(defaultConfiguration)};
    }
    var subsystemConfig = JSLog.configuration[subsystem];
    if (!(category in subsystemConfig)){
        subsystemConfig[category] = Object.create(subsystemConfig.__any__);
    }
    var config = JSLog.configuration[subsystem][category];
    for (var level in config){
        config[level].hooks = [];
    }
    return config;
};

JSLog.hook = function(subsystem, category, level, hook){
    var config = JSLog.getOrCreateConfig(subsystem, category);
    config[level].hooks.push(hook);
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
        record.category.length <= 16 ? record.category : (record.category.substr(0, 13) + '...')
    ];
    var format = "%t %-5{public} %-16{public} %-16{public} " + record.message;
    return format.format(jslog_formatter, args.concat(record.args));
};

var isCallingHooks = false;

JSLog.write = function(record){
    JSLog.buffer.write(record);
};

JSLog.getRecords = function(){
    return this.buffer.readAll();
};

JSLog.dump = function(){
    var records = JSLog.getRecords();
    var record = record;
    for (var i = 0, l = records.length; i < l; ++i){
        console[record.level](JSLog.format(record));
    }
};

JSLog.buffer = JSLogBuffer(100);

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
        if (e.stack){
            var lines = [];
            if (e.stack){
                lines = e.stack.split("\n");
                lines.unshift("");
                return e.toString() + lines.join("\n                                                       ");
            }
            return e.toString();
            // var stack = e.stack.split("\n");
            // var info = parseStackLine(stack[0]);
            // return e.toString() + ' \u2014 ' + info.function + ' \u2014 ' + info.file + ':' + info.line;
        }
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
        if (config.console){
            config.console(JSLog.format(record));
        }
        if (config.persist && !isCallingHooks){
            isCallingHooks = true;
            var records = JSLog.getRecords();
            var hook;
            for (var i = 0, l = config.hooks.length; i < l; ++i){
                hook = config.hooks[i];
                hook.enqueueRecord(record, records);
            }
            isCallingHooks = false;
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

var parseStackLine = function(line){
    if (line.substr(0, 14) == '    at Object.'){
        line = line.substr(14);
    }else if (line.charAt(0) == '.'){
        line = line.substr(1);
    }
    var info = {
        function: '(?)',
        file: '(?)',
        line: '(?)'
    };
    var atIndex = line.indexOf('@');
    if (atIndex >= 0){
        info.function = line.substr(0, atIndex);
        line = line.substr(atIndex + 1);
    }
    var lastColonIndex = line.lastIndexOf(':');
    if (lastColonIndex >= 0){
        var secondLastColonIndex = line.lastIndexOf(':', lastColonIndex - 1);
        if (secondLastColonIndex >= 0){
            info.line = parseInt(line.substr(secondLastColonIndex + 1, lastColonIndex - secondLastColonIndex - 1));
            line = line.substr(0, secondLastColonIndex);
        }else{
            line = line.substr(0, lastColonIndex);
        }
    }
    var lastSlashIndex = line.lastIndexOf('/');
    if (lastSlashIndex >= 0){
        info.file = line.substr(lastSlashIndex + 1);
    }else{
        info.file = line;
    }
    return info;
};

var defaultConfiguration = {
    debug: {
        enabled: false,
        persist: false,
        console: console.debug
    },
    info: {
        enabled: true,
        persist: false,
        console: console.info
    },
    log: {
        enabled: true,
        persist: false,
        console: console.log
    },
    warn: {
        enabled: true,
        persist: false,
        console: console.warn
    },
    error: {
        enabled: true,
        persist: true,
        console: console.error
    }
};

})();
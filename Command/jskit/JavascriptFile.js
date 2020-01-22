// #import Foundation
'use strict';

JSClass("JavascriptFile", JSObject, {

    initWithData: function(data, url){
        this.data = data;
        this.url = url;
        this.length = data.length;
    },

    url: null,
    data: null,
    length: 0,
    offset: 0,
    context: 0,
    lineNumber: 0,
    lineOffset: 0,

    reset: function(){
        this.offset = 0;
        this.context = 0;
        this.lineNumber = 0;
        this.lineOffset = 0;
    },

    imports: function(){
        this.reset();
        var imports = {
            paths: [],
            frameworks: [],
            features: [],
        };
        var scan = this.next();
        while (scan !== null){
            if (scan.command == "import"){
                if (scan.path){
                    imports.paths.push({
                        path: scan.path,
                        sourceURL: this.url,
                        sourceLine: this.lineNumber
                    });
                }else if (scan.framework){
                    imports.frameworks.push({
                        name: scan.framework,
                        sourceURL: this.url,
                        sourceLine: this.lineNumber
                    });
                }
            }else if (scan.command == "feature"){
                imports.features.push(scan.args);
            }
            scan = this.next();
        }
        return imports;
    },

    globals: function(){
        var globals = [];
        this.reset();
        var scan = this.next();
        var validName = /^[A-Za-z\$_][A-Za-z0-9_]*$/;
        while (scan !== null){
            if (scan.code){
                let i = 0;
                let l = scan.code.length;
                while (i < l){
                    let jsindex = scan.code.indexOf('JS', i);
                    if (jsindex < 0){
                        break;
                    }
                    i = jsindex + 2;
                    if (scan.code.substr(i, 6) == 'Class('){
                        i += 6;
                        let quote = scan.code.charAt(i);
                        ++i;
                        let endIndex = scan.code.indexOf(quote, i);
                        if (endIndex > i){
                            let name = scan.code.substr(i, endIndex - i);
                            if (name.match(validName)){
                                globals.push(name);
                            }
                            i = endIndex + 1;
                        }else{
                            ++i;
                        }
                    }else if (scan.code.substr(i, 13) == 'GlobalObject.'){
                        i += 13;
                        let endIndex = scan.code.indexOf('=', i);
                        if (endIndex > i){
                            let name = scan.code.substr(i, endIndex - i).replace(/\s+$/,"");
                            if (name.match(validName)){
                                globals.push(name);
                            }
                            i = endIndex + 1;
                        }else{
                            ++i;
                        }
                    }else if (scan.code.substr(i, 9) == 'Protocol('){
                        i += 9;
                        let quote = scan.code.charAt(i);
                        ++i;
                        let endIndex = scan.code.indexOf(quote, i);
                        if (endIndex > i){
                            let name = scan.code.substr(i, endIndex - i);
                            if (name.match(validName)){
                                globals.push(name);
                            }
                            i = endIndex + 1;
                        }else{
                            ++i;
                        }
                    }
                }
            }
            scan = this.next();
        }
        return globals;
    },

    next: function(){
        while (this.offset < this.length){
            let start = this.offset;
            let end = start;
            let b;
            var trimLeadingWhitespace = this.context === JavascriptFile.Context.js;
            var skipNext = false;
            for (; this.offset < this.length; ++this.offset){
                b = this.data[this.offset];
                if (b === 0x0A){
                    skipNext = false;
                    break;
                }
                if (this.context === JavascriptFile.Context.js){
                    if (b == 0x27){
                        this.context = JavascriptFile.Context.singleQuoteString;
                        ++end;
                    }else if (b == 0x22){
                        this.context = JavascriptFile.Context.doubleQuoteString;
                        ++end;
                    }else if (b == 0x2F && this.offset < this.length - 1 && this.data[this.offset + 1] == 0x2A){
                        this.context = JavascriptFile.Context.blockComment;
                        this.offset += 2;
                        break;
                    }else if (b == 0x2F && this.offset < this.length - 1 && this.data[this.offset + 1] == 0x2F){
                        this.context = JavascriptFile.Context.lineComment;
                        this.offset += 2;
                        break;
                    }else{
                        ++end;
                    }
                }else if (this.context === JavascriptFile.Context.singleQuoteString){
                    if (b == 0x5C){
                        skipNext = true;
                    }else if (b == 0x27){
                        this.context = JavascriptFile.Context.js;
                    }else{
                        skipNext = false;
                    }
                    ++end;
                }else if (this.context === JavascriptFile.Context.doubleQuoteString){
                    if (b == 0x5C){
                        skipNext = true;
                    }else if (b == 0x22){
                        this.context = JavascriptFile.Context.js;
                    }else{
                        skipNext = false;
                    }
                    ++end;
                }else if (this.context === JavascriptFile.Context.blockComment){
                    if (b == 0x2F && this.data[this.offset - 1] == 0x2A){
                        this.context = JavascriptFile.Context.js;
                    }
                    start = this.offset + 1;
                    end = start;
                    trimLeadingWhitespace = true;
                }else if (this.context === JavascriptFile.Context.lineComment){
                    ++end;
                }
            }

            var startedAtLineOffset = start === this.lineOffset;

            // ignore leading whitespace
            if (trimLeadingWhitespace){
                while (start < end && (this.data[start] == 0x20 || this.data[start] == 0x09)){
                    ++start;
                }
            }

            // decode the part of the line between start and end
            var line = this.data.subdataInRange(JSRange(start, end - start)).stringByDecodingUTF8();
            let lineNumber = this.lineNumber;
            let columnNumber = start - this.lineOffset;

            // We've stopped at a new line
            if (this.offset < this.length && b == 0x0A){

                // Update offset and line/column counters
                ++this.offset;
                ++this.lineNumber;
                this.lineOffset = this.offset;

                // remove any trailing carriage return
                if (line.endsWith("\r")){
                    line = line.substr(0, line.length - 1);
                    --end;
                }

                // If we're at the end of a line, but still in a multi-line string,
                // make sure to add back the trailing newline.
                if (this.context === JavascriptFile.Context.singleQuoteString || this.context === JavascriptFile.Context.doubleQuoteString){
                    line += "\n";
                    ++end;
                }
            }

            // Single line comments automatically end at the end of the line
            if (this.context === JavascriptFile.Context.lineComment && (this.offset === this.length || b === 0x0A)){
                this.context = JavascriptFile.Context.js;

                // We might have a single line command, which has to start
                // at the beginning of the line
                if (columnNumber === 2 && line.startsWith(' #')){
                    let spaceIndex = line.indexOf(" ", 2);
                    let command;
                    let args;
                    if (spaceIndex < 0){
                        command = line.substr(2);
                        args = null;
                    }else{
                        command = line.substr(2, spaceIndex - 2);
                        args = line.substr(spaceIndex + 1).trim();
                    }
                    let handler = commands[command];
                    let scan = {command: command, args: args, lineNumber: lineNumber, columnNumber: columnNumber};
                    if (handler){
                        let parsed = handler(args);
                        for (let k in parsed){
                            scan[k] = parsed[k];
                        }
                    }
                    return scan;
                }

                // If this isn't a command comment, ignore it
                start = end;
            }

            // If we have anything to return, do it
            if (start < end){
                if (startedAtLineOffset && (line == "'use strict';" || line == '"use strict";')){
                    return {
                        strict: true,
                        lineNumber: lineNumber,
                        columnNumber: columnNumber
                    };
                }
                return {
                    code: line,
                    lineNumber: lineNumber,
                    columnNumber: columnNumber
                };
            }
        }
        return null;
    }

});

var commands = {

    import: function(args){
        let arg = args.trim();
        if (arg.startsWith('"') && arg.endsWith('"')){
            return {path: arg.substr(1, arg.length - 2)};
        }
        return {framework: arg};
    }

};

var findToken = function(line, index){
    for (var i = index, l = line.length; i < l; ++i){
        if (line[i] == '"'){
            return {token: '"', index: i};
        }
        if (line[i] == "'"){
            return {token: "'", index: i};
        }
        if (line[i] == "/"){
            ++i;
            if (i < l){
                if (line[i] == '*'){
                    return {token: '/*', index: i - 1};
                }
                if (line[i] == '/'){
                    return {token: '//', index: i - 1};
                }
            }
            --i;
        }
    }
    return {token: null, index: -1};
};

JavascriptFile.Context = {
    js: 0,
    lineComment: 1,
    blockComment: 2,
    singleQuoteString: 3,
    doubleQuoteString: 4
};
// #import Foundation
/* global JSClass, JSObject, JavascriptFile, JSRange */
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

    imports: function(){
        var imports = {
            paths: [],
            frameworks: [],
            features: []
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

    next: function(){
        var code = "";
        while (code === ""){
            var line = this.nextLine();
            if (line === null){
                return null;
            }
            if (line.startsWith("// #")){
                let spaceIndex = line.indexOf(" ", 4);
                let command;
                let args;
                if (spaceIndex < 0){
                    command = line.substr(4);
                    args = null;
                }else{
                    command = line.substr(4, spaceIndex - 4);
                    args = line.substr(spaceIndex + 1).trim();
                }
                let handler = commands[command];
                let scan = {command: command, args: args};
                if (handler){
                    let parsed = handler(args);
                    for (let k in parsed){
                        scan[k] = parsed[k];
                    }
                }
                return scan;
            }
            var index = 0;
            while (index >= 0){
                let result = findToken(line, index);
                index = result.index;
                if (result.token == "'" || result.token == '"'){
                    index = line.indexOf(result.token, index + 1);
                    while (index > 0 && line[index - 1] == '\\'){
                        index = line.indexOf(result.token, index + 1);
                    }
                    while (index < 0 && line[line.length - 1] == "\\"){
                        code += line + "\n";
                        line = this.nextLine();
                        index = line.indexOf(result.token);
                        while (index > 0 && line[index - 1] == '\\'){
                            index = line.indexOf(result.token, index + 1);
                        }
                    }
                    if (index >= 0){
                        index += 1;
                    }
                }else if (result.token == "//"){
                    line = line.substr(0, index);
                    index = -1;
                }else if (result.token == "/*"){
                    code += line.substr(0, index);
                    index = line.indexOf('*/', index + 2);
                    while (index < 0){
                        line = this.nextLine();
                        index = line.indexOf('*/');
                    }
                    line = line.substr(index + 2);
                    index = 0;
                }else{
                    index = -1;
                }
            }
            code += line;
            code = code.trim();
            if (code == "'use strict';"){
                return {strict: true};
            }
        }
        return {code: code};
    },

    nextLine: function(){
        ++this.lineNumber;
        var startingOffset = this.offset;
        while (this.offset < this.length && this.data[this.offset] != 0x0A){
            ++this.offset;
        }
        var endingOffset = this.offset;
        if (this.data[this.offset] == 0x0A){
            if (this.offset > startingOffset){
                if (this.data[this.offset - 1] == 0x0D){
                    --endingOffset;
                }
            }
            ++this.offset;
        }
        if (endingOffset > startingOffset){
            return this.data.subdataInRange(JSRange(startingOffset, endingOffset - startingOffset)).stringByDecodingUTF8();
        }
        if (this.offset == this.length){
            return null;
        }
        return "";
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
    comment: 0,
    singleString: 0,
    doubleString: 0
};
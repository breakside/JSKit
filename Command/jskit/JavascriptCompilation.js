// #import Foundation
// #import "JavascriptFile.js"
'use strict';

JSClass("JavascriptCompilation", JSObject, {

    initWithName: function(name, outputDirectoryURL, fileManager){
        this.name = name;
        this.files = [];
        this.frameworks = [];
        this._frameworkSet = new Set();
        this.outputChunks = [];
        this.outputDirectoryURL = outputDirectoryURL;
        this.extension = name.fileExtension;
        this.nameWithoutExtension = this.name.substr(0, this.name.length - this.extension.length);
        this.fileManager = fileManager;
        this.sources = [];
        this.mappings = [[]];
    },

    name: null,
    nameWithoutExtension: null,
    extension: null,
    frameworks: null,
    _frameworkSet: null,
    files: null,

    fileManager: null,
    outputDirectoryURL: null,
    outputChunks: null,
    outputNumber: 0,
    outputUsesStrict: undefined,
    outputLineNumber: 0,
    outputColumnNumber: 0,
    sources: null,
    sourceRoot: "",
    mappings: null,

    write: function(text){
        var chunk = text.utf8();
        this.outputChunks.push(chunk);
        if (text.endsWith("\n")){
            ++this.outputLineNumber;
            this.outputColumnNumber = 0;
            this.mappings.push([]);
        }else{
            this.outputColumnNumber += chunk.length;
        }
    },

    writeComment: function(text){
        var lines = text.split("\n");
        for (let i = 0, l = lines.length; i < l; ++i){
            let line = lines[i];
            this.write("// " + line + "\n");
        }
    },

    writeJavascriptAtURL: async function(url){
        let data = await this.fileManager.contentsAtURL(url);
        let js = JavascriptFile.initWithData(data);
        var scan = js.next();
        var useStrict;
        while (scan !== null){
            if (scan.strict){
                if (useStrict !== undefined){
                    throw new Error("'use strict' must be the first line of code in a file");
                }
                useStrict = true;
            }else if (scan.command == 'import'){
                if (scan.framework){
                    this._frameworkSet.add(scan.framework);
                }
            }else if (scan.code){
                if (useStrict === undefined){
                    useStrict = false;
                }
                let needsStrict = false;
                if (this.outputUsesStrict === undefined){
                    this.outputUsesStrict = useStrict;
                    needsStrict = this.outputUsesStrict;
                }
                if (useStrict !== this.outputUsesStrict){
                    await this._saveChunks();
                }
                if (needsStrict){
                    this.write("'use strict';\n");
                }
                if (this.outputColumnNumber > 0 && this.outputColumnNumber + scan.code.length > 4096){
                    this.write("\n");
                }
                var segments = this.mappings[this.mappings.length - 1];
                segments.push([this.outputColumnNumber, this.sources.length - 1, scan.lineNumber, scan.columnNumber]);
                this.write(scan.code);

                if (this.outputColumnNumber > 0 && this.outputColumnNumber + scan.code.length > 4096){
                    scan.code += "\n";
                }
            }
            scan = js.next();
        }
    },

    finish: async function(){
        await this._saveChunks();
        this.frameworks = Array.from(this._frameworkSet.values());
    },

    _saveChunks: async function(){
        // Always save the initial output file, even if it's empty, but don't
        // save subsequent output files if they're empty.
        if (this.outputNumber > 0 && this.outputChunks.length === 0){
            return;
        }
        var url;
        if (this.outputNumber === 0){
            url = this.outputDirectoryURL.appendingPathComponent(this.name);
        }else{
            url = this.outputDirectoryURL.appendingPathComponent(this.nameWithoutExtension + '.' + this.outputNumber + this.extension);
        }

        // source map
        var mapURL = url.appendingFileExtension('.map');
        var map = {
            version: 3,
            file: mapURL.lastPathComponent,
            sourceRoot: this.sourceRoot,
            sources: this.sources,
            names: [],
            mappings: base64ForMappings(this.mappings)
        };
        var mapJSON = JSON.stringify(map, null, 2);
        await this.fileManager.createFileAtURL(mapURL, mapJSON.utf8());
        this.outputChunks.push("\n//# sourceMappingURL=%s".sprintf(mapURL.lastPathComponent).utf8());

        // write
        var data = JSData.initWithChunks(this.outputChunks);
        await this.fileManager.createFileAtURL(url, data);
        this.files.push(url.lastPathComponent);

        // reset
        ++this.outputNumber;
        this.outputChunks = [];
        this.sources = [];
        this.mappings = [[]];
        this.outputLineNumber = 0;
        this.outputColumnNumber = 0;
    }

});

var base64ForMappings = function(mappings){
    var encodedLines = [];
    var base = [0,0,0,0,0];
    for (var i = 0, l = mappings.length; i < l; ++i){
        var segments = mappings[i];
        var encodedSegments = [];
        base[0] = 0;
        for (var j = 0, k = segments.length; j < k; ++j){
            var fields = segments[j];
            var encoded = "";
            for (var x = 0, y = fields.length; x < y; ++x){
                var n = fields[x];
                var b = base[x];
                encoded += vlq(n - b);
                base[x] = n;
            }
            encodedSegments.push(encoded);
        }
        encodedLines.push(encodedSegments.join(','));
    }
    return encodedLines.join(';');
};

var vlq = function(n){
    var negative = 0;
    if (n < 0){
        negative = 1;
        n = -n;
    }
    n = (n << 1) | negative;
    var b64 = "";
    while (n >= 32){
        b64 += base64EncodingMap[0x20 | (n & 0x1F)];
        n = n >> 5;
    }
    b64 += base64EncodingMap[n];
    return b64;
};

var base64EncodingMap = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
    'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f',
    'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v',
    'w', 'x', 'y', 'z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '/'
];
// #import Foundation
// #import "JavascriptFile.js"
/* global JSClass, JSObject, JSData, JavascriptCompilation, JavascriptFile */
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

    write: function(text){
        this.outputChunks.push(text.utf8());
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
        var code = "";
        while (scan !== null){
            scan = js.next();
            if (scan.strict){
                if (useStrict !== undefined){
                    throw new Error("'use strict' must be the first line of code in a file");
                }
                useStrict = true;
            }else if (scan.code){
                if (code.length === 0 && useStrict === undefined){
                    useStrict = false;
                }
                code += scan.code;
            }else if (scan.command == 'import'){
                if (scan.framework){
                    this._frameworkSet.add(scan.framework);
                }
            }
        }
        if (code.length > 0){
            if (this.outputUsesStrict === undefined){
                this.outputUsesStrict = useStrict;
            }
            if (useStrict !== this.outputUsesStrict){
                await this._saveChunks();
            }
            this.write(code);
        }
    },

    finish: async function(){
        await this._saveChunks();
        this.frameworks = this._frameworkSet.values();
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
        ++this.outputNumber;
        var data = JSData.initWithChunks(this.outputChunks);
        await this.fileManager.createFileAtURL(url, data);
        this.files.push(url.lastPathComponent);
        this.outputChunks = [];
    }

});
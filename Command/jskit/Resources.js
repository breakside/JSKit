// #import Foundation
// #import Hash
// #import FontKit
// #import DOM
// #import jsyaml
/* global JSClass, JSObject, JSSHA1Hash, JSFileManager, jsyaml, FNTOpenTypeFont, Zlib, JSData, XMLParser */
'use strict';

JSClass("Resources", JSObject, {

    initWithFileManager: function(fileManager){
        this.lookup = {global: {}};
        this.metadata = [];
        this.sourceURLs = [];
        this.fileManager = fileManager;
    },

    lookup: null,
    sourceURLs: null,
    metadata: null,

    addResourceAtURL: async function(url){
        var name = url.lastPathComponent;
        var subdirectory = null;
        var ext = url.fileExtension;
        if (ext == ".lproj"){
            await this._addLocalization(url);
        }else if (ext == ".imageset"){
            await this._addImageset(url, 'global');
        }else{
            await this._addResource(url, 'global');
        }
    },

    getImportPaths: async function(importDirectoryURLs){
        var fileManager = this.fileManager;
        var addImportsFromObject = async function(obj){
            if (typeof(obj) == "object"){
                if ('class' in obj){
                    let path = obj['class'] + '.js';
                    let url = await urlForPath(path);
                    if (url !== null){
                        paths.push(path);
                    }
                }
                if ('include' in obj){
                    let includes;
                    if (typeof(obj.include) == 'string'){
                        includes = [obj.include];
                    }else{
                        includes = obj.include;
                    }
                    for (let i = 0, l = includes.length; i < l; ++i){
                        let path = includes[i];
                        if (path.endsWith("/*")){
                            let directoryPath = path.substr(0, path.length - 1);
                            let directoryURL = await urlForPath(directoryPath);
                            let entries = await fileManager.contentsOfDirectoryAtURL(directoryURL);
                            for (let j = 0, k = entries.length; j < k; ++j){
                                let entry = entries[j];
                                if (entry.name.fileExtension == '.js'){
                                    paths.push(directoryPath + entry.name);
                                }
                            }
                        }else{
                            paths.push(path);
                        }
                    }
                }
                for (let k in obj){
                    if (k == 'class' || k == 'include') continue;
                    await addImportsFromObject(obj[k]);
                }
            }
        };
        var urlForPath = async function(path){
            let isDirectory = path.endsWith('/');
            if (isDirectory){
                path = path.substr(0, path.length - 1);
            }
            for (let i = 0, l = importDirectoryURLs.length; i < l; ++i){
                let url = importDirectoryURLs[i].appendingPathComponent(path, isDirectory);
                let exists = await fileManager.itemExistsAtURL(url);
                if (exists){
                    return url;
                }
            }
            return null;
        };
        var paths = [];
        for (let i = 0, l = this.metadata.length; i < l; ++i){
            let metadata = this.metadata[i];
            if (metadata.spec){
                await addImportsFromObject(metadata.value);
            }
        }
        return paths;
    },

    _resourceId: 0,

    _addLocalization: async function(url){
        var entries = await this.fileManager.contentsOfDirectoryAtURL(url);
        var entry;
        var lang = url.lastPathComponent.substr(0, url.lastPathComponent.length - 6); // stripping .lproj
        this.lookup[lang] = {};
        for (let i = 0, l = entries.length; i < l; ++i){
            entry = entries[i];
            if (entry.itemType == JSFileManager.ItemType.directory){
                if (entry.name.fileExtension == '.imageset'){
                    this._addImageset(entry.url, lang);
                }
            }else{
                await this._addResource(entry.url, lang);
            }
        }
    },

    _addImageset: async function(url, lang){
        var entries = await this.fileManager.contentsOfDirectoryAtURL(url);
        var entry;
        var subdirectory = url.lastPathComponent;
        for (let i = 0, l = entries.length; i < l; ++i){
            entry = entries[i];
            if (entry.itemType != JSFileManager.ItemType.directory){
                await this._addResource(entry.url, lang, subdirectory);
            }
        }
    },

    _addResource: async function(url, lang, subdirectory){
        // name and path
        var name = url.lastPathComponent;
        var ext = name.fileExtension;
        var pathComponents = [];
        if (lang != 'global'){
            pathComponents.push(lang + '.lproj');
        }
        if (subdirectory){
            pathComponents.push(subdirectory);
        }
        pathComponents.push(name);
        var path = pathComponents.join("/");

        // populate metadata
        var contents = await this.fileManager.contentsAtURL(url);
        var hash = JSSHA1Hash(contents);
        var metadata = {
            path: path,
            byte_size: contents.length,
            mimetype: mimeTypesByExt[ext] || null,
            hash: hash.hexStringRepresentation()
        };
        var extra = addMetadata[ext];
        if (extra){
            extra.call(this, name, contents, metadata);
        }
        this.sourceURLs.push(url);
        this.metadata.push(metadata);
        
        // Add to lookup
        var names = [path];
        if (ext){
            names.push(path.substr(0, path.length - ext.length));
        }
        var lookup = this.lookup[lang];
        for (let i = 0, l = names.length; i < l; ++i){
            name = names[i];
            if (!(name in lookup)){
                lookup[name] = [];
            }
            if (ext){
                lookup[name].push(this._resourceId);
            }else{
                // If we don't hanve an ext, always insert at the front of the hit list
                lookup[name].unshift(this._resourceId);
            }
        }

        ++this._resourceId;
    },

    ignoreFontErrors: false,

});

var addMetadata = {
    '.json': async function(name, contents, metadata){
        metadata.value = JSON.parse(contents.stringByDecodingUTF8());
        if (name.endsWith('.spec.json')){
            metadata.spec = true;
        }
    },

    '.yaml': async function(name, contents, metadata){
        metadata.value = jsyaml.safeLoad(contents.stringByDecodingUTF8());
        if (name.endsWith('.spec.yaml')){
            metadata.spec = true;
        }
    },

    '.png': async function(name, contents, metadata){
        if (contents.length >= 24 &&
            // magic
            contents[0] == 0x89 &&
            contents[1] == 0x50 &&
            contents[2] == 0x4E &&
            contents[3] == 0x47 &&
            contents[4] == 0x0D &&
            contents[5] == 0x0A &&
            contents[6] == 0x1A &&
            contents[7] == 0x0A && 

            // IHDR
            contents[12] == 0x49 &&
            contents[13] == 0x48 &&
            contents[14] == 0x44 &&
            contents[15] == 0x52)
        {
            var dataView = contents.dataView();
            metadata.image = {
                width: dataView.getUint32(16),
                height: dataView.getUint32(20)
            };
        }
    },

    '.jpg': async function(name, contents, metadata){
        if (contents.length < 2 || contents[0] != 0xFF || contents[0] != 0xD8){
            // not a jpeg
            return;
        }
        var dataView = contents.dataView();
        var i = 0;
        var b;
        var l = contents.length;
        var blockLength;
        var blockdata;
        while (i < l){
            b = contents[i++];
            if (b != 0xFF){
                // TODO: Error, not at a maker
                return;
            }
            if (i == l){
                // TODO: Error, not enough room for marker
                return;
            }
            b = contents[i++];
            if (b == 0x00){
                // TODO: Error, invalid marker
                return;
            }
            // D0-D9 are standalone markers...make sure not to look for a length
            if (b < 0xD0 || b > 0xD9){
                if (i >= l - 2){
                    // TODO: Error, not enough room for block header
                    return;
                }
                blockLength = dataView.getUint16(i);
                if (i + blockLength > l){
                    // TODO: Error, not enough room for block data
                    return;
                }
                // C0-CF are start of frame blocks, expect for C4 and CC
                // start of frame blocks have image sizes
                if (b >= 0xC0 && b <= 0xCF && b != 0xC4 && b != 0xCC){
                    if (blockLength >= 7){
                        metadata.image = {
                            height: dataView.getUint16(i + 3),
                            width: dataView.getUint16(i + 5)
                        };
                    }
                    return;
                }
            }
        }
    },

    '.svg': async function(name, contents, metadata){
        var xml = contents.stringByDecodingUTF8();
        if (!xml.startsWith("<?xml")){
            return;
        }
        metadata.image = {
            vector: true
        };
        var parser = new XMLParser();
        try {
            parser.parse(xml, {
                beginElement: function(name, prefix, namespace, attributes, isClosed){
                    var multiple = {
                        'em': 12,
                        'ex': 24,
                        'px': 1,
                        'in': 72,
                        'cm': 72/2.54,
                        'mm': 72/25.4,
                        'pt': 1,
                        'pc': 12
                    };
                    var px = function(length){
                        if (length === undefined || length === null){
                            return undefined;
                        }
                        var matches = length.match(/^\s*(\d+)\s*(em|ex|px|in|cm|mm|pt|pc|%)?\s*$/);
                        if (!matches){
                            return undefined;
                        }
                        let n = parseInt(matches[1]);
                        if (!matches[2]){
                            return n;
                        }
                        let unit = matches[2];
                        if (unit == '%'){
                            return undefined;
                        }
                        return multiple[unit] * n;
                    };
                    if (namespace == 'http://www.w3.org/2000/svg' && name.toLowerCase() == 'svg'){
                        var attrs = {};
                        for (let i = 0, l = attributes.length; i < l; ++i){
                            let attr = attributes[i];
                            if (attr.namespace === null){
                                attrs[attr.name] = attr.value;
                            }
                        }
                        metadata.width = px(attrs.width);
                        metadata.height = px(attrs.height);
                    }
                    throw new Error("Stopping parser");
                }
            });
        }catch (e){
            // either an intentional stop or...
            // oh well
        }
    },

    '.ttf': async function(name, contents, metadata){
        try{
            let font = FNTOpenTypeFont.initWithData(contents);
            metadata.font = {};
            let head = font.tables.head;
            if (head){
                metadata.font.yMax = head.yMax;
                metadata.font.yMin = head.yMin;
                metadata.font.unitsPerEM = head.unitsPerEM;
            }
            let name = font.tables.name;
            if (name){
                let family = name.getName(
                    [1, 0, 0, 16],
                    [1, 0, 0, 1],
                    [3, 1, 1033, 16],
                    [3, 1, 1033, 1],
                );
                if (family !== null){
                    metadata.font.family = family;
                }
                let face = name.getName(
                    [1, 0, 0, 17],
                    [1, 0, 0, 2],
                    [3, 1, 1033, 17],
                    [3, 1, 1033, 2],
                );
                if (face !== null){
                    metadata.font.face = face;
                }
                let uniqueID = name.getName(
                    [1, 0, 0, 3],
                    [3, 1, 1033, 3],
                );
                if (uniqueID !== null){
                    metadata.font.unique_identifier = uniqueID;
                }
                let fontName = name.getName(
                    [1, 0, 0, 4],
                    [3, 1, 1033, 4],
                );
                if (fontName !== null){
                    metadata.font.name = fontName;
                }
                let postscript = name.getName(
                    [1, 0, 0, 6],
                    [3, 1, 1033, 6],
                );
                if (postscript !== null){
                    metadata.font.postscript_name = postscript;
                }
            }
            let os2 = font.tables['OS/2'];
            if (os2){
                metadata.font.weight = os2.usWeightClass;
                metadata.font.style = (os2.fsSelection & 0x0001) ? 'italic' : 'normal';
                metadata.font.os2ascender = os2.sTypoAscender;
                metadata.font.os2descender = os2.sTypoDescender;
                metadata.font.os2line_gap = os2.sTypoLineGap;
                metadata.font.winascender = os2.usWinAscent;
                metadata.font.windescender = os2.usWinDescent;
            }
            let cmap = font.tables.cmap;
            if (cmap){
                let map = cmap.getMap(
                    [0, 4],
                    [0, 3],
                    [0, 2],
                    [0, 1],
                    [0, 0],
                    [3, 10],
                    [3, 1],
                );
                let data = null;
                if (map !== null){
                }
                if (data !== null){
                    metadata.font.cmap = {
                        format: map.format,
                        data: Zlib.compress(data).base64StringRepresentation()
                    };
                }
            }
            let hhea = font.tables.hhea;
            if (hhea){
                metadata.font.ascender = hhea.ascender;
                metadata.font.descender = hhea.descender;
                metadata.font.line_gap = hhea.lineGap;
                let hmtx = font.tables.hmtx;
                let data = JSData.initWithLength(hhea.numberOfHMetrics);
                let dataView = data.dataView();
                let o = 0;
                for (let i = 0; i < hhea.numberOfHMetrics; ++i, o += 2){
                    let width = hmtx.widthOfGlyph(i);
                    dataView.setUint16(o, width);
                }
                metadata.font.widths = Zlib.compress(data).base64StringRepresentation();
            }
        }catch (e){
            // Some fonts bundled with the FontKitTests will
            // throw errors because they're intentionally corrupt
            if (!this.ignoreFontErrors){
                throw e;
            }
        }
    },
};

var adjustSpecMetadata = function(metadata){
    metadata.spec = true;
    // TODO: compile constraints
    // port from python
    //     if isinstance(obj, dict):
    //     if 'constraints' in obj and 'equalities' in obj['constraints']: 
    //         refs = dict(self='<self>')
    //         if 'references' in obj['constraints']:
    //             refs.update(obj['constraints']['references'])
    //         obj['constraints'] = self.compileConstraints(obj['constraints']['equalities'], refs)
    //     for k, v in obj.items():
    //         if k not in ('constraints',):
    //             self.compileSpecConstraints(v)
    // elif isinstance(obj, list):
    //     for v in obj:
    //         self.compileSpecConstraints(v)
};

addMetadata['.jpeg'] = addMetadata['.jpg'];
addMetadata['.otf'] = addMetadata['.ttf'];

var mimeTypesByExt = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".xml": "text/xml",
    ".txt": "text/plain",
    ".gif": "image/gif",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".svg": "image/svg+xmlsvg",
    ".pdf": "application/pdf",
    ".woff": "application/font-woff",
    ".ttf": "application/x-font-ttf",
    ".otf": "font/opentype",
    ".yaml": "application/x-yaml"
};
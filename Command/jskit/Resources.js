// #import Foundation
// #import Hash
// #import jsyaml
/* global JSClass, JSObject, JSSHA1Hash, JSFileManager, jsyaml */
'use strict';

JSClass("Resources", JSObject, {

    init: function(){
        this.lookup = {global: {}};
        this.metadata = [];
        this.sourceURLs = [];
    },

    lookup: null,
    sourceURLs: null,
    metadata: null,

    addResourceAtURL: async function(url){
        var name = url.lastPathComponent;
        var subdirectory = null;
        var ext = url.fileExtension;
        if (ext == ".lproj"){
            this._addLocalization(url);
        }else if (ext == ".imageset"){
            this._addImageset(url, 'global');
        }else{
            this._addResource(url, 'global');
        }
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
                this._addResource(entry.url, lang);
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
                this._addResource(entry.url, lang, subdirectory);
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
        var contents = await this.fileManager.contentsOfItemAtURL(url);
        var hash = JSSHA1Hash(contents);
        var metadata = {
            path: path,
            byte_size: contents.length,
            mime_type: mimeTypesByExt[ext] || null,
            hash: hash
        };
        var extra = addMetadata[ext];
        if (extra){
            extra.call(this, contents, metadata);
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

});

var addMetadata = {
    '.json': async function(contents, metadata){
        metadata.value = JSON.parse(contents.stringByDecodingUTF8());
    },

    '.yaml': async function(contents, metadata){
        metadata.value = jsyaml.safeLoad(contents.stringByDecodingUTF8());
    },

    '.png': async function(contents, metadata){
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

    '.jpg': async function(contents, metadata){
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

    '.svg': async function(contents, metadata){
        var xml = contents.stringByDecodingUTF8();
        if (!xml.startsWith("<?xml")){
            return;
        }
        metadata.image = {
            vector: true
        };
    },

    '.ttf': async function(contents, metadata){
    },
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
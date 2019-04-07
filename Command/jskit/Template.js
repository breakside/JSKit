// #import Foundation
/* global JSClass, JSObject, JSFileManager */
'use strict';

JSClass("Template", JSObject, {

    initWithURL: function(url, fileManager){
        this.url = url;
        this.fileManager = fileManager;
    },

    addToWorkspace: async function(workspaceURL, projectName){
        var projectNameFileSafe = projectName.replace(/[^A-Za-z0-9\-_]/g, "");
        var params = {
            PROJECT_NAME: projectName,
            PROJECT_NAME_FILE_SAFE: projectNameFileSafe
        };
        await this._copyContentsOfDirectory(this.url, workspaceURL, params);
    },

    _copyContentsOfDirectory: async function(directoryURL, toDirectoryURL, params){
        var entries = await this.fileManager.contentsOfDirectoryAtURL(directoryURL);
        for (let i = 0, l = entries.length; i < l; ++i){
            let entry = entries[i];
            let toName = entry.name.replacingTemplateParameters(params, '${');
            if (entry.name == ".DS_Store") continue;
            if (entry.itemType == JSFileManager.ItemType.directory){
                let toURL = toDirectoryURL.appendingPathComponent(toName, true);
                await this.fileManager.createDirectoryAtURL(toURL);
                await this._copyContentsOfDirectory(entry.url, toURL, params);
            }else{
                let toURL = toDirectoryURL.appendingPathComponent(toName);
                let data = await this.fileManager.contentsAtURL(entry.url);
                // FIXME: assuming everything is text
                let contents = data.stringByDecodingUTF8();
                let replaced = contents.replacingTemplateParameters(params, '${');
                await this.fileManager.createFileAtURL(toURL, replaced.utf8());
            }
        }
    }

});
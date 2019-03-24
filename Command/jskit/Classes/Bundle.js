// #import "Foundation/Foundation.js"
// #import "jsyaml/jsyaml.js"
/* global JSClass, JSObject, JSFileManager, require, jsyaml */
'use strict';

JSClass("Bundle", JSObject, {

    initWithURL: function(url){
        this.rootURL = url;
    },

    rootURL: null,

    load: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        var fileManager = JSFileManager.shared;
        var infoURL = this.rootURL.appendingPathComponent("Info.json");
        fileManager.itemExistsAtURL(infoURL, function(exists){
            if (exists){
                fileManager.contentsAtURL(infoURL, function(json){
                    if (json === null){
                        completion.call(target, false);
                        return;
                    }
                    this.info = JSON.parse(json.stringByDecodingUTF8());
                }, this);
            }else{
                infoURL = this.rootURL.appendingPathComponent("Info.yaml");
                fileManager.itemExistsAtURL(infoURL, function(exists){
                    if (exists){
                        fileManager.contentsAtURL(infoURL, function(yaml){
                            if (yaml === null){
                                completion.call(target, false);
                                return;
                            }
                            this.info = jsyaml.safeLoad(yaml.stringByDecodingUTF8());
                        }, this);
                    }else{
                        completion.call(target, false);
                    }
                }, this);
            }
        }, this);
        return completion.promise;
    },

    info: null,

});
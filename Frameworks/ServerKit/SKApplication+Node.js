// #import "SKApplication.js"
// jshint node: true
'use strict';

SKApplication.definePropertiesFromExtensions({

    rawProcessArguments: function(){
        return process.argv.slice(1);
    },

    _getWorkingDirectoryURL: function(){
        return JSFileManager.shared.urlForPath(process.cwd(), null, true);
    },

    _getDefaultEnvironment: function(){
        return process.env;
    }

});
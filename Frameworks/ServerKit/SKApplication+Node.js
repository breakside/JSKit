// #import "ServerKit/SKApplication.js"
/* global SKApplication, process */
'use strict';

SKApplication.definePropertiesFromExtensions({

    rawProcessArguments: function(){
        return process.execArgv;
    }

});
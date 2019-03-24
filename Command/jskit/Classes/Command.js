// #import "Foundation/Foundation.js"
/* global JSClass, JSObject, JSDynamicProperty, Command, process */
'use strict';

JSClass("Command", JSObject, {

    name: null,
    options: null,

    initWithName: function(name){
        var subclass = Command.byName[name];
        if (subclass){
            return subclass.init();
        }
        return null;
    },

    init: function(){
    },

    arguments: null,

    returnValue: JSDynamicProperty(),

    getReturnValue: function(){
        return process.exitCode;
    },

    setReturnValue: function(value){
        process.exitCode = value;
    },

    run: function(){
    },

});

Command.names = [];
Command.byName = {};

Command.$extend = function(extensions, name){
    var subclass = JSClass.prototype.$extend.call(this, extensions, name);
    this.names.push(extensions.name);
    this.byName[extensions.name] = subclass;
    return subclass;
};
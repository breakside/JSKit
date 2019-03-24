// #import "Command.js"
/* global JSClass, Command */
'use strict';

JSClass("InitCommand", Command, {

    name: "init",

    options: {
        template: {kind: "positional", help: "The project template to use as a starting point", allowed: ["html", "http", "node", "tests", "framework"]},
    },

    run: function(){
    }

});
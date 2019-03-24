// #import "Command.js"
/* global JSClass, Command */
'use strict';

JSClass("ProjectCommand", Command, {

    name: "project",

    options: {
        template: {kind: "positional", help: "The project template to use as a starting point", allowed: ["html", "server", "node", "tests", "framework"]},
        name: {kind: "positional", help: "The name of your new project"}
    },

    run: function(){
    }

});
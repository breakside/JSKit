// #import "Command.js"
/* global JSClass, Command */
'use strict';

JSClass("AddCommand", Command, {

    name: "add",

    options: {
        template: {kind: "positional", help: "The project template to use as a starting point", allowed: ["tests", "framework"]},
        name: {kind: "positional", help: "The name for the added component"}
    },

    run: function(){
    }

});
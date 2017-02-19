// #feature window
/* global window, console */
'use strict';

var JSGlobalObject = window;

JSGlobalObject.JSLog = console.log;

// function JSLog(msg){
//     var format_args = Array.prototype.slice.call(arguments, 1);
//     if (console){
//         console.log(msg.sprintf.apply(msg, format_args));
//     }
// }
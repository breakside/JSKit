// #import "UIKit/UIEvent.js"
/* global UIEvent, navigator */
'use strict';

if (navigator && navigator.userAgent.indexOf("Macintosh") !== -1){
    UIEvent.Modifiers.platformCommand = UIEvent.Modifiers.command;
}else{
    UIEvent.Modifiers.platformCommand = UIEvent.Modifiers.control;
}
// #import Foundation
// #import APIKit
"use strict";

JSClass("${PROJECT_NAME_FILE_SAFE}", APIResponder, {

    get: async function(){
        return {
            message: "Hello, world!"
        };
    }

});
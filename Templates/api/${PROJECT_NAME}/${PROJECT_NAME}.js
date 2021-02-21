// #import Foundation
// #import APIKit
"use strict";

JSClass("${PROJECT_NAME_FILE_SAFE}", APIResponder, {

    get: async function(request, response){
        return {
            message: "Hello, world!"
        };
    }

});
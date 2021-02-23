// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #import "APIRequest.js"
// #import "APIResponse.js"
// #import "APIError.js"
// #import "APISecrets.js"
// #import "APISecretsEnvironmentProvider.js"
"use strict";

var logger = JSLog("api", "lambda");

JSGlobalObject.APILambda = async function(event, bundle){
    bundle = bundle || JSBundle.mainBundle;
    let response = APIResponse.init();
    try{
        let responderClassName = bundle.info.APIResponder;
        if (!responderClassName){
            throw new Error("Missing APIResponder in Info.yaml");
        }
        let responderClass = JSClass.FromName(bundle.info.APIResponder);
        let request = APIRequest.initFromLambdaEvent(event);
        let responder = responderClass.initWithRequest(request, response);
        responder.secrets = APISecrets.initWithNames(bundle.info.APISecrets || []);
        responder.secrets.addProvider(APISecretsEnvironmentProvider.initWithEnvironment(JSEnvironment.current));
        if (event.pathParameters){
            responder.definePropertiesFromPathParameters(event.pathParameters);
        }
        var method = responder.objectMethodForRequestMethod(request.method);
        if (typeof(method) == 'function'){
            await responder.prepare();
            let obj = await method.call(responder);
            if (obj !== null && obj !== undefined){
                response.object = obj;
            }
        }else{
            response.statusCode = APIResponse.StatusCode.methodNotAllowed;
        }
    }catch(e){
        if (e instanceof APIError){
            response.statusCode = e.statusCode;
            response.object = {message: e.message};
        }else if (e instanceof APIValidatingObject.Error){
            response.statusCode = APIResponse.StatusCode.badRequest;
            response.object = {invalid: e.info};
        }else{
            logger.error(e);
            response.statusCode = APIResponse.StatusCode.internalServerError;
            response.data = null;
        }
    }
    return response.lambdaResponse();
};
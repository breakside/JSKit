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
"use strict";

APIRequest.definePropertiesFromExtensions({
    initFromLambdaEvent: function(event){
        var method;
        var url = JSURL.init();
        var query = JSFormFieldMap();
        var headerMap = JSMIMEHeaderMap();
        var data = null;
        if (event.version == "2.0"){
            method = event.requestContext.http.method;
            url.path = event.requestContext.http.path;
            if (event.headers){
                for (let name in event.headers){
                    let value = event.headers[name];
                    headerMap.add(name, value);
                }
            }
            if (typeof(event.rawQueryString) === "string"){
                query.decode(event.rawQueryString.utf8(), true);
            }
        }else{
            method = event.httpMethod;
            url.path = event.path;
            if (event.multiValueQueryStringParameters){
                for (let name in event.multiValueQueryStringParameters){
                    let values = event.multiValueQueryStringParameters[name];
                    for (let value of values){
                        query.add(name, value);
                    }
                }
            }
            if (event.multiValueHeaders){
                for (let name in event.multiValueHeaders){
                    let headers = event.multiValueHeaders[name];
                    for (let value of headers){
                        headerMap.add(name, value);
                    }
                }
            }
            if (event.body !== null && event.body !== undefined){
                if (event.isBase64Encoded){
                    data = event.body.dataByDecodingBase64();
                }else{
                    data = event.body.utf8();
                }
            }
        }
        if (query.fields.length > 0){
            url.query = query;
        }

        this.initWithMethodAndURL(method, url, headerMap);

        this._data = data;
    },
});

APIRequest.defineInitMethod("initFromLambdaEvent");
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

// #import "Command.js"
// #import "Printer.js"
// #import SecurityKit
'use strict';

JSClass("KeyCommand", Command, {

    name: "key",
    help: "Create a symmetric encryption key",

    options: {
        format: {default: "raw", help: "The format for the key", allowed: ["jwk", "raw"]},
        bits: {default: 512, valueType: "integer", allowed: [256, 384, 512], help: "The bit length of the key data"}
    },

    run: async function(){
        var workspaceURL = this.workingDirectoryURL;
        var hmacAlgorithm = {
            256: SECHMAC.Algorithm.sha256,
            384: SECHMAC.Algorithm.sha384,
            512: SECHMAC.Algorithm.sha512
        }[this.arguments.bits];
        var hmac = SECHMAC.initWithAlgorithm(hmacAlgorithm);
        var key = await hmac.createKey();
        var data = await key.getData();
        var printer = Printer.initWithLabel('key');
        if (this.arguments.format === "jwk"){
            var jwk = {
                kty: SECJSONWebToken.KeyType.symmetric,
                k: data.base64URLStringRepresentation(),
                kid: JSSHA1Hash(UUID.init().bytes).base64URLStringRepresentation(),
                alg: {
                    256: SECJSONWebToken.Algorithm.hmacSHA256,
                    384: SECJSONWebToken.Algorithm.hmacSHA384,
                    512: SECJSONWebToken.Algorithm.hmacSHA512
                }[this.arguments.bits]
            };
            data = JSON.stringify(jwk).utf8();
        }
        printer.print(data.base64URLStringRepresentation());
        printer.print("\n");
    },

});
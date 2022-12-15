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

JSClass("KeypairCommand", Command, {

    name: "keypair",
    help: "Create an asymmetric encryption key pair",

    options: {
        format: {default: "pem", help: "The format for the key", allowed: ["jwk", "pem"]},
        algorithm: {default: "ecdh", help: "The encryption algorithm to use", allowed: ["ecdh", "rsa"]},
        bits: {default: 512, valueType: "integer", allowed: [256, 384, 512], help: "The bit length of the key data"}
    },

    run: async function(){
        var workspaceURL = this.workingDirectoryURL;
        var printer = Printer.initWithLabel('key');
        var algorithm;
        switch (this.arguments.algorithm){
            case "ecdh":
                switch (this.arguments.bits){
                    case 256: algorithm = SECSign.Algorithm.ellipticCurveSHA256; break;
                    case 384: algorithm = SECSign.Algorithm.ellipticCurveSHA384; break;
                    case 512: algorithm = SECSign.Algorithm.ellipticCurveSHA512; break;
                    default: throw new Error("Unsupported algorithm/bits combination");
                }
                break;
            case "rsa":
                switch (this.arguments.bits){
                    case 256: algorithm = SECSign.Algorithm.rsaSHA256; break;
                    case 384: algorithm = SECSign.Algorithm.rsaSHA384; break;
                    case 512: algorithm = SECSign.Algorithm.rsaSHA512; break;
                    default: throw new Error("Unsupported algorithm/bits combination");
                }
                break;
            default:
                throw new Error("Unsupported algorithm/bits combination");
        }
        var sign = SECSign.initWithAlgorithm(algorithm);
        var pair;
        if (this.arguments.format === "jwk"){
            pair = await sign.createJWKPair({});
            printer.print("public:  %s\n".sprintf(JSON.stringify(pair.public).utf8().base64URLStringRepresentation()));
            printer.print("private: %s\n".sprintf(JSON.stringify(pair.private).utf8().base64URLStringRepresentation()));
        }else if (this.arguments.format === "pem"){
            pair = await sign.createKeyPair({});
            var data = await pair.public.getData();
            printer.print(data.stringByDecodingUTF8());
            printer.print("\n");
            data = await pair.private.getData();
            printer.print(data.stringByDecodingUTF8());
            printer.print("\n");
        }
    },

});
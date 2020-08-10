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

// #import Foundation
// #import "SECHash.js"
// #import "SECHMAC.js"
'use strict';

(function(){

var logger = JSLog("securitykit", "keystore");

JSClass("SECKeystore", JSObject, {

    init: function(){
        this.keysByName = {};
    },

    keysByName: null,

    setKeyForName: function(keyData, name){
        this.keysByName[name] = keyData;
    },

    setBase64EncodedKeyForName: function(base64Key, name){
        if (base64Key === null){
            return;
        }
        this.keysByName[name] = base64Key.dataByDecodingBase64();
    },

    setBase64URLEncodedJWKForName: function(base64URLJWK, name){
        if (base64URLJWK === null){
            return;
        }
        this.keysByName[name] = JSON.parse(String.initWithData(base64URLJWK.dataByDecodingBase64(), String.Encoding.utf8));
    },

    keyForName: function(name, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var keyData = this.keysByName[name];
        if (keyData === undefined){
            keyData = null;
        }
        JSRunLoop.main.schedule(completion, target, keyData);
        return completion.promise;
    }

});

JSClass("SECAWSKeystore", JSObject, {

    initWithCredentials: function(credentials, urlSession){
        SECAWSKeystore.$super.init.call(this);
        this.credentials = credentials;
        this.urlSession = urlSession || JSURLSession.shared;
        this.encryptedKeysByName = {};
    },

    setEncryptedKeyForName: function(encryptedKeyInfo, name){
        if (encryptedKeyInfo === null){
            return;
        }
        var semiIndex = encryptedKeyInfo.indexOf(';');
        if (semiIndex < 0){
            throw new Error("Invalid encrypted key info.  Expecting string with result from GenerateDataKeyWithoutPlainText combined into the format: KeyId;CiphertextBlob");
        }
        var arn = encryptedKeyInfo.substr(0, semiIndex);
        var parts = arn.split(":");
        if (parts[0] != "arn"){
            throw new Error("Invalid encrypted key info.  Expecting string with result from GenerateDataKeyWithoutPlainText combined into the format: KeyId;CiphertextBlob");
        }
        if (parts[2] != "kms"){
            throw new Error("Invalid encrypted key info.  Expecting string with result from GenerateDataKeyWithoutPlainText combined into the format: KeyId;CiphertextBlob");
        }
        if (parts[5] != "key"){
            throw new Error("Invalid encrypted key info.  Expecting string with result from GenerateDataKeyWithoutPlainText combined into the format: KeyId;CiphertextBlob");
        }
        var region = parts[3];
        var encryptedKeyBase64 = encryptedKeyInfo.substr(semiIndex + 1);
        this.encryptedKeysByName[name] = {
            keyId: arn,
            region: region,
            base64: encryptedKeyBase64
        };
    },

    credentials: null,
    encryptedKeysByName: null,
    accessKeyId: null,
    secretKey: null,

    keyForName: function(name, completion, target){
        var encryptedKey = this.encryptedKeysByName[name];
        if (!encryptedKey){
            return SECAWSKeystore.$super.keyForName.call(this, name, completion, target);
        }
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var request = SECAWSRequest.initWithService("kms", encryptedKey.region);
        request.method = JSURLRequest.Method.post;
        request.data = JSON.stringify({"CiphertextBlob": encryptedKey.base64}).utf8();
        request.contentType = SECAWSRequest.jsonContentType;
        request.headerMap.add("Content-Length", request.data.length);
        request.headerMap.add("X-Amz-Target", "TrentService.Decrypt");
        request.sign(this.credentials, function(success){
            if (!success){
                logger.error("Failed to sign AWS KMS request, can't fetch key");
                completion.call(target, null);
                return;
            }
            var task = this.urlSession.dataTaskWithRequest(request, function(error){
                if (task.response === null){
                    logger.error("AWS KMS request did not receive response");
                    completion.call(target, null);
                    return;
                }
                if (task.response.statusCode !== JSURLResponse.StatusCode.ok){
                    logger.error("AWS KMS response %d", task.response.statusCode);
                    completion.call(target, null);
                    return;
                }
                if (task.response.contentType === null){
                    logger.error("AWS KMS response missing content type");
                    completion.call(target, null);
                    return;
                }
                if (task.response.contentType.mime != SECAWSRequest.jsonContentType.mime){
                    logger.error("AWS KMS response unexpected content type '%s'", task.response.contentType.mime);
                    completion.call(target, null);
                    return;
                }
                var data = null;
                try{
                    var json = String.initWithData(task.response.body, String.Encoding.utf8);
                    var object = JSON.parse(json);
                    data = object.Plaintext.dataByDecodingBase64();
                }catch (e){
                    logger.error("Failed to decode AWS KMS response JSON: %{error}", e);
                }
                completion.call(target, data);
            }, this);
        }, this);
        return completion.promise;
    },

    urlSession: null

});

JSClass("SECAWSCredentials", JSObject, {

    initWithAccessKey: function(accessKeyId, secretAccessKey){
        this.accessKeyId = accessKeyId;
        this.secretAccessKey = secretAccessKey;
    },

    accessKeyId: null,
    secretAccessKey: null,
    sessionToken: null,
    expiresAt: null,

    load: function(completion, target){
        if (!completion){
            completion = Promise.completion();
        }

        // clear expired credentials
        if (this.expiresAt !== null && JSDate.now > this.expiresAt){
            this.accessKeyId = null;
            this.secretAccessKey = null;
            this.sessionToken = null;
            this.expiresAt = null;
        }

        // return if we still have credentials
        if (this.accessKeyId !== null && this.secretAccessKey !== null){
            JSRunLoop.main.schedule(completion, target, true);
            return;   
        }

        // Try to get credentials from the container
        var containerURL = JSEnvironment.current.get("AWS_CONTAINER_CREDENTIALS_RELATIVE_URI", null);
        if (containerURL !== null){
            this.loadContainerCredentails(containerURL, completion, target);
            return;
        }
        return completion.promise;
    },

    loadContainerCredentails: function(path, completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        var url = JSURL.initWithString("http://169.254.170.2");
        url.path = path;
        var request = JSURLRequest.initWithURL(url);
        var task = JSURLSession.shared.dataTaskWithRequest(request, function(error){
            if (task.response === null){
                logger.debug("Failed to get a response from 169.254.170.2");
                completion.call(target, false);
                return;
            }
            if (task.response.statusCode !== JSURLResponse.StatusCode.success){
                logger.error("Got %d response from 169.254.170.2", task.response.statusCode);
                completion.call(target, false);
                return;
            }
            var loaded = false;
            try{
                var json = String.initWithData(task.response.body, String.Encoding.utf8);
                var credentials = JSON.parse(json);
                this.accessKeyId = credentials.AccessKeyId;
                this.secretAccessKey = credentials.SecretAccessKey;
                this.sessionToken = credentials.Token;
                this.expiresAt = this.parseDateString(credentials.Expiration);
                loaded = true;
            }catch (e){
                logger.error("Failed to parse response from 169.254.170.2: %{error}", e);
            }
            completion.call(target, loaded);
        }, this);
        return completion.promise;
    },

    parseDateString: function(str){
        var calendar = JSCalendar.gregorian;
        str = str.replace(":", "").replace("-", "");
        var matches = str.match(/^(\d\d)(\d\d)(\d\d)T(\d\d)(\d\d)(\d\d)Z$/);
        if (matches === null){
            throw new Error("Invalid date format: %s".sprintf(str));
        }
        var components = {
            year: parseInt(matches[1]),
            month: parseInt(matches[2]),
            day: parseInt(matches[3]),
            hour: parseInt(matches[4]),
            minute: parseInt(matches[5]),
            second: parseInt(matches[6]),
            timezone: JSTimeZone.utc
        };
        return calendar.dateFromComponents(components);
    }

});

JSClass("SECAWSRequest", JSURLRequest, {

    service: null,
    region: null,

    initWithService: function(service, region, path){
        var url = JSURL.init();
        url.scheme = "https";
        url.host = "%s.%s.amazonaws.com".sprintf(service, region);
        url.path = path || "/";
        SECAWSRequest.$super.initWithURL.call(this, url);
    },

    sign: function(credentials, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        credentials.load(function(success){
            if (!success){
                logger.error("Failed to load AWS credentials");
                completion.call(target, false);
                return;
            }
            var dateWithTime = SECAWSRequest.dateFormatter.stringForDate(JSDate.now);
            var date = dateWithTime.substr(0, 6);
            this.headerMap.add("X-Amz-Date", dateWithTime);

            if (credentials.sessionToken !== null){
                this.headerMap.add("X-Amz-Security-Token", credentials.sessionToken);
            }

            var payloadHash = SECHash.initWithAlgorithm(SECHash.Algorithm.sha256);
            payloadHash.update(this.data);
            payloadHash.digest(function(payloadDigest){
                if (payloadDigest === null){
                    logger.error("Failed to hash request payload");
                    completion.call(target, false);
                    return;
                }
                var newline = "\n".utf8();
                var colon = ":".utf8();
                var encodedPath = this.url.encodedPath;
                if (encodedPath.length === 0){
                    encodedPath = "/".utf8();
                }
                var canonicalRequestHash = SECHash.initWithAlgorithm(SECHash.Algorithm.sha256);
                canonicalRequestHash.update(this.method.utf8());
                canonicalRequestHash.update(newline);
                canonicalRequestHash.update(encodedPath.dataByEncodingPercentEscapes()); // twice-encoded path
                canonicalRequestHash.update(newline);
                // TODO: query string
                canonicalRequestHash.update(newline);
                var headers = this.canonicalHeaders();
                var header;
                var i, l;
                var signedHeaders = [];
                for (i = 0, l = headers.length; i < l; ++i){
                    header = headers[i];
                    canonicalRequestHash.update(header.name.utf8());
                    canonicalRequestHash.update(colon);
                    canonicalRequestHash.update(header.value.utf8());
                    canonicalRequestHash.update(newline);
                    signedHeaders.push(header.name);
                }
                canonicalRequestHash.update(newline);
                canonicalRequestHash.update(signedHeaders.join(";").utf8());
                canonicalRequestHash.update(newline);
                canonicalRequestHash.update(payloadDigest.hexStringRepresentation().lowercaseString().utf8());
                canonicalRequestHash.digest(function(canonicalRequestDigest){
                    if (canonicalRequestDigest === null){
                        logger.error("Failed to hash canonical request");
                        completion.call(target, false);
                        return;
                    }
                    var region = this.region;
                    var service = this.service;
                    var credentialScope = "%s/%s/%s/aws4_request".sprintf(date, region, service);
                    var algorithm = "AWS4-HMAC-SHA256";
                    var stringToSign = "%s\n%s\n%s\n%s".sprintf(algorithm, dateWithTime, credentialScope, canonicalRequestDigest.hexStringRepresentation().lowercaseString());
                    var request = this;
                    var hmac = SECHMAC.initWithAlgorithm(SECHMAC.Algorithm.sha256);
                    hmac.createKeyWithData(("AWS4" + credentials.secretAccessKey).utf8()).then(function(key){
                        hmac.key = key;
                        hmac.update(date.utf8());
                        return hmac.sign();
                    }).then(function(signature){
                        hmac = SECHMAC.initWithAlgorithm(SECHMAC.Algorithm.sha256);
                        return hmac.createKeyWithData(signature);
                    }).then(function(key){
                        hmac.key = key;
                        hmac.update(region.utf8());
                        return hmac.sign();
                    }).then(function(signature){
                        hmac = SECHMAC.initWithAlgorithm(SECHMAC.Algorithm.sha256);
                        return hmac.createKeyWithData(signature);
                    }).then(function(key){
                        hmac.key = key;
                        hmac.update(service.utf8());
                        return hmac.sign();
                    }).then(function(signature){
                        hmac = SECHMAC.initWithAlgorithm(SECHMAC.Algorithm.sha256);
                        return hmac.createKeyWithData(signature);
                    }).then(function(key){
                        hmac.key = key;
                        hmac.update("aws4_request".utf8());
                        return hmac.sign();
                    }).then(function(signature){
                        hmac = SECHMAC.initWithAlgorithm(SECHMAC.Algorithm.sha256);
                        return hmac.createKeyWithData(signature);
                    }).then(function(key){
                        hmac.key = key;
                        hmac.update(stringToSign.utf8());
                        return hmac.sign();
                    }).then(function(signature){
                        request.headerMap.add("Authorization", "%s Credential=%s/%s, SignedHeaders=%s, Signature=%s".sprintf(algorithm, credentials.accessKeyId, credentialScope, signedHeaders.join(";"), signature.hexStringRepresentation().lowercaseString()));
                        completion.call(target, true);
                    }).catch(function(error){
                        if (error){
                            logger.error("Failed to sign AWS request: %{error}", error);
                        }else{
                            logger.error("Failed to sign AWS request");
                        }
                        completion.call(target, false);
                    });
                }, this);
            }, this);
        }, this);
        return completion.promise;
    },

    canonicalHeaders: function(){
        var headers = [];
        var originalHeader;
        var header;
        for (var i = 0, l = this.headerMap.headers.length; i < l; ++i){
            originalHeader = this.headerMap.headers[i];
            header = JSMIMEHeader(originalHeader.name.lowercaseString(), originalHeader.value.trim().replace(/[ ]+/, " "));
            headers.push(header);
        }
        headers.push("host", this.url.host);
        headers.sort(function(a, b){
            return a.name.localeCompare(b.name);
        });
        return headers;
    }

});


SECAWSRequest.dateFormatter = JSDateFormatter.init();
SECAWSRequest.dateFormatter.timezone = JSTimeZone.utc;
SECAWSRequest.dateFormatter.dateFormat = "yyyyMMdd'T'HHmmss'Z'";

SECAWSRequest.jsonContentType = JSMediaType("application/x-amz-json-1.1");

})();
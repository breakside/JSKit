// Copyright 2021 Breakside Inc.
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

// #import "JSObject.js"
'use strict';

JSClass("JSIPAddress", JSObject, {

    family: null,
    data: null,

    initWithString: function(str){
        if (str === null || str === undefined){
            return null;
        }
        var matches = str.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
        var a, b, c, d;
        if (matches !== null){
            this.family = JSIPAddress.Family.ip4;
            a = parseInt(matches[1]);
            b = parseInt(matches[2]);
            c = parseInt(matches[3]);
            d = parseInt(matches[4]);
            if (a > 0xFF || b > 0xFF || c > 0xFF || d > 0xFF){
                return null;
            }
            this.data = JSData.initWithArray([a, b, c, d]);
        }else{
            this.family = JSIPAddress.Family.ip6;
            this.data = JSData.initWithLength(16);
            matches = str.match(/:(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
            if (matches !== null){
                str = str.substr(0, str.length - matches[0].length);
                a = parseInt(matches[1]);
                b = parseInt(matches[2]);
                c = parseInt(matches[3]);
                d = parseInt(matches[4]);
                if (a > 0xFF || b > 0xFF || c > 0xFF || d > 0xFF){
                    return null;
                }
                str += ":%x:%x".sprintf((a << 8) | b, (c << 8) | d);
            }
            this.data = JSData.initWithLength(16);
            var i, l, di;
            var parts;
            var part;
            var n;
            var start;
            var end;
            if (str !== "::"){
                parts = str.split("::");
                if (parts.length > 2){
                    return;
                }
                if (parts.length === 1){
                    start = parts[0];
                }else{
                    if (parts[0] !== ""){
                        start = parts[0];
                    }
                    if (parts[1] !== ""){
                        end = parts[1];
                    }
                }
                if (start){
                    parts = start.split(":");
                    for (i = 0, l = parts.length, di = 0; i < l; ++i, ++di){
                        part = parts[i];
                        if (part.length === 0 || part.length > 4){
                            return null;
                        }
                        n = parseInt(part, 16);
                        if (isNaN(n)){
                            return null;
                        }
                        this.data[di++] = (n >> 8);
                        this.data[di] = n & 0xFF;
                    }
                }
                if (end){
                    parts = end.split(":");
                    for (i = parts.length - 1, di = this.data.length - 1; i >= 0; --i, --di){
                        part = parts[i];
                        if (part.length === 0 || part.length > 4){
                            return null;
                        }
                        n = parseInt(part, 16);
                        if (isNaN(n)){
                            return null;
                        }
                        this.data[di--] = n & 0xFF;
                        this.data[di] = (n >> 8);
                    }
                }
            }
        }
    },

    initWithData: function(data){
        if (data.length == 4){
            this.family = JSIPAddress.Family.ip4;
            this.data = data;
        }else if (data.length == 16){
            this.family = JSIPAddress.Family.ip6;
            this.data = data;
        }else{
            return null;
        }
    },

    isEqual: function(other){
        if (!(other instanceof JSIPAddress)){
            return false;
        }
        if (this.family != other.family){
            return false;
        }
        return this.data.isEqual(other.data);
    },

    stringRepresentation: function(){
        var d = this.data;
        if (this.family == JSIPAddress.Family.ip4){
            return "%d.%d.%d.%d".sprintf(d[0], d[1], d[2], d[3]);
        }
        if (d[0] + d[1] + d[2] + d[3] + d[4] + d[5] + d[6] + d[7] + d[8] + d[9] === 0){
            if (d[10] == 0x00 && d[11] == 0x00){
                if (d[12] == 0x00 && d[13] == 0x00){
                    if (d[14] == 0x00 && d[15] == 0x00){
                        return "::";
                    }
                    return "::%x".sprintf((d[14] << 8) | d[15]);
                }
                return "::%d.%d.%d.%d".sprintf(d[12], d[13], d[14], d[15]);
            }
            if (d[10] == 0xFF && d[11] == 0xFF){
                return "::ffff:%d.%d.%d.%d".sprintf(d[12], d[13], d[14], d[15]);
            }
        }
        return "%x:%x:%x:%x:%x:%x:%x:%x".sprintf(
            (d[0] << 8) | d[1],
            (d[2] << 8) | d[3],
            (d[4] << 8) | d[5],
            (d[6] << 8) | d[7],
            (d[8] << 8) | d[9],
            (d[10] << 8) | d[11],
            (d[12] << 8) | d[13],
            (d[14] << 8) | d[15]
        );
    },

    toString: function(){
        return "[JSIPAddress %s]".sprintf(this.stringRepresentation());
    }

});

JSIPAddress.Family = {
    ip4: "ip4",
    ip6: "ip6"
};

JSIPAddress.Protocol = {
    tcp: 6,
    udp: 17
};
// #import "JSObject.js"
'use strict';

JSClass("JSIPAddress", JSObject, {

    family: null,
    data: null,

    initWithString: function(str){
        if (str === null || str === undefined){
            return;
        }
        var matches = str.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
        if (matches !== null){
            this.family = JSIPAddress.Family.ip4;
            this.data = JSData.initWithArray([parseInt(matches[1]), parseInt(matches[2]), parseInt(matches[3]), parseInt(matches[4])]);
        }else{
            this.family = JSIPAddress.Family.ip6;
            this.data = JSData.initWithLength(16);
            matches = str.match(/^::ffff:(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
            if (matches !== null){
                this.data[10] = 0xFF;
                this.data[11] = 0xFF;
                this.data[12] = parseInt(matches[1]);
                this.data[13] = parseInt(matches[2]);
                this.data[14] = parseInt(matches[3]);
                this.data[15] = parseInt(matches[4]);
            }else{
                this.data = JSData.initWithLength(16);
                var parts = str.split(":");
                var part;
                var n;
                var di = 0;
                var i, l;
                for (i = 0, l = parts.length; i < l; ++i){
                    part = parts[i];
                    if (part == ""){
                        break;
                    }
                    n = parseInt(n, 16);
                    if (isNaN(n)){
                        return null;
                    }
                    this.data[di++] = (n & 0xFF00) >> 8;
                    this.data[di++] = n & 0xFF;
                }
                di = this.data.length - 1;
                for (var j = l - 1; j > i; --j){
                    part = parts[j];
                    if (part == ""){
                        break;
                    }
                    n = parseInt(n, 16);
                    if (isNaN(n)){
                        return null;
                    }
                    this.data[di--] = n & 0xFF;
                    this.data[di--] = (n & 0xFF00) >> 8;
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
        if (this.family == JSIPAddress.Family.ip4){
            return "%d.%d.%d.%d".sprintf(this.data[0], this.data[1], this.data[2], this.data[3]);
        }
        return "%x:%x:%x:%x:%x:%x:%x:%x".sprintf(
            (this.data[0] << 8) | this.data[1],
            (this.data[2] << 8) | this.data[3],
            (this.data[4] << 8) | this.data[5],
            (this.data[6] << 8) | this.data[7],
            (this.data[8] << 8) | this.data[9],
            (this.data[10] << 8) | this.data[11],
            (this.data[12] << 8) | this.data[13],
            (this.data[14] << 8) | this.data[15]
        );
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
// #import Foundation
/* global JSClass, JSObject, JSData */
'use strict';

JSClass("Printer", JSObject, {

    initWithLabel: function(label){
        this.statusMessage = JSData.initWithLength(0);
        this.label = label;
    },

    // -----------------------------------------------------------------------
    // MARK: - Status messages

    statusMessage: null,

    setStatus: function(message){
        if (this.statusMessage !== null){
            this._erase(this.statusMessage.length);
        }
        var prefix = "[%s] ".sprintf(this.label);
        var line = prefix + message;
        this.statusMessage = line.utf8();
        this._printRawData(this.statusMessage);
    },

    print: function(message, reprintStatus=false, overwriteStatus=false){
        // if (overwriteStatus){
        //     reprintStatus = true;
        // }
        if (!overwriteStatus && this.statusMessage.length > 0){
            this._printRawData("\n".utf8(), false);
        }
        if (overwriteStatus){
            this._erase(this.statusMessage.length);
        }
        this._printRawData(message.utf8());
        if (reprintStatus){
            if (message.length > 0 && !message.endsWith("\n")){
                this._printRawData("\n".utf8(), false);
            }
            this._printRawData(this.statusMessage);
        }else{
            this.statusMessage = JSData.initWithLength(0);
        }
    },

    _printRawData: function(data, flush=false){
        process.stdout.write(data);
        if (flush){
            process.stdout.flush();
        }
    },

    _erase: function(count, flush=false){
        if (process.stdout.isTTY){
            this._printRawData("".leftPaddedString("\x08", count).utf8(), flush);
            this._printRawData("\x1B[0K".utf8());
        }else if (count > 0){
            this._printRawData("\n".utf8());
        }
    }

});
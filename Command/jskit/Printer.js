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
'use strict';

JSClass("Printer", JSObject, {

    initWithLabel: function(label){
        this.statusMessage = JSData.initWithLength(0);
        this.label = label;
    },

    stream: process.stdout,

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
        this.stream.write(data);
        if (flush){
            this.stream.flush();
        }
    },

    _erase: function(count, flush=false){
        if (this.stream.isTTY){
            this._printRawData("".leftPaddedString("\x08", count).utf8(), flush);
            this._printRawData("\x1B[0K".utf8());
        }else if (count > 0){
            this._printRawData("\n".utf8());
        }
    }

});
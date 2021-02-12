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

// #import "SETokenizer.js"
"use strict";

JSClass("SEStandardTokenizer", SETokenizer, {

    string: null,
    iterator: null,

    initWithString: function(str){
        this.string = str;
        this.iterator = str.unicodeIterator();
        this.c0 = null;
        this.c1 = null;
        this.c2 = this.iterator.character;
        this.index = this.iterator.index;
        this.iterator.increment();
        this.c3 = this.iterator.character;
    },

    c0: null,
    c1: null,
    c2: null,
    c3: null,

    index: null,

    next: function(){
        while (this.c2 !== null){
            var index0 = this.index;
            var isToken = this.c2.wordBreakAHLetter || this.c2.wordBreakNumeric;
            do{
                if (this.c1 === null || (!this.c1.wordBreakFormat && !this.c1.wordBreakExtend)){
                    this.c0 = this.c1;
                }
                if (!this.c2.wordBreakFormat && !this.c2.wordBreakExtend){
                    this.c1 = this.c2;
                }
                this.c2 = this.c3;
                this.index = this.iterator.index;
                this.iterator.increment();
                this.c3 = this.iterator.character;
            } while(!this.isWordBoundary());
            if (this.index > index0 && isToken){
                return this.string.substring(index0, this.index).toLowerCase();
            }
        }
        return null;
    },

    isWordBoundary: function(){
        var c0 = this.c0;
        var c1 = this.c1;
        var c2 = this.c2;
        var c3 = this.c3;
        // See http://www.unicode.org/reports/tr29/
        // WB1: sot ÷
        if (c1 === null){
            return true;
        }
        // WB1: ÷ eot
        if (c2 === null){
            return true;
        }

        // WB3: CR × LF
        if (c1.wordBreakCR && c2.wordBreakLF){
            return false;
        }
        // WB3a: (Newline | CR | LF) ÷
        if (c1.wordBreakCR || c1.wordBreakLF || c1.wordBreakNewline){
            return true;
        }
        // WB3b: ÷ (Newline | CR | LF)
        if (c2.wordBreakCR || c2.wordBreakLF || c2.wordBreakNewline){
            return true;
        }

        // WB4: X (Extend | Format)* → X
        // ...the same as Any × (Format | Extend)
        if (c2.wordBreakFormat || c2.wordBreakExtend){
            return false;
        }

        // WB5: AHLetter × AHLetter
        if (c1.wordBreakAHLetter && c2.wordBreakAHLetter){
            return false;
        }

        // Custom: break on . and : in the middle of words
        if (c3 !== null && c1.wordBreakAHLetter && (c2.code === 0x2E || c2.code == 0x2024 || c2.code == 0xFE52 || c2.code === 0xFF0E || c2.code == 0x3A) && c3.wordBreakAHLetter){
            return true;
        }

        // Custom: break on . and : in the middle of words
        if (c0 !== null && c0.wordBreakAHLetter && (c1.code === 0x2E || c1.code == 0x2024 || c1.code == 0xFE52 || c1.code === 0xFF0E  || c1.code == 0x3A) && c2.wordBreakAHLetter){
            return true;
        }

        // WB6: AHLetter × (MidLetter | MidNumLetQ) AHLetter
        if (c3 !== null && c1.wordBreakAHLetter && (c2.wordBreakMidLetter || c2.wordBreakMidNumLetQ) && c3.wordBreakAHLetter){
            return false;
        }
        // WB7: AHLetter (MidLetter | MidNumLetQ) × AHLetter
        if (c0 !== null && c0.wordBreakAHLetter && (c1.wordBreakMidLetter || c1.wordBreakMidNumLetQ) && c2.wordBreakAHLetter){
            return false;
        }
        // WB7a: Hebrew_Letter × Single_Quote
        if (c1.wordBreakHebrewLetter && c2.wordBreakSingleQuote){
            return false;
        }
        // WB7b: Hebrew_Letter × Double_Quote Hebrew_Letter
        if (c3 !== null && c1.wordBreakHebrewLetter && c2.wordBreakDoubleQuote && c3.wordBreakHebrewLetter){
            return false;
        }
        // WB7c: Hebrew_Letter Double_Quote × Hebrew_Letter
        if (c0 !== null && c0.wordBreakHebrewLetter && c1.wordBreakDoubleQuote && c2.wordBreakHebrewLetter){
            return false;
        }
        // WB8: Numeric × Numeric
        if (c1.wordBreakNumeric && c2.wordBreakNumeric){
            return false;
        }
        // WB9: AHLetter × Numeric
        if (c1.wordBreakAHLetter && c2.wordBreakNumeric){
            return false;
        }
        // WB10: Numeric × AHLetter
        if (c1.wordBreakNumeric && c2.wordBreakAHLetter){
            return false;
        }
        // WB11: Numeric (MidNum | MidNumLetQ) × Numeric
        if (c0 !== null && c0.wordBreakNumeric && (c1.wordBreakMidNum || c1.wordBreakMidNumLetQ) && c2.wordBreakNumeric){
            return false;
        }
        // WB12: Numeric × (MidNum | MidNumLetQ) Numeric
        if (c3 !== null && c1.wordBreakNumeric && (c2.wordBreakMidNum || c2.wordBreakMidNumLetQ) && c3.wordBreakNumeric){
            return false;
        }
        // WB13: Katakana × Katakana
        if (c1.wordBreakKatakana && c2.wordBreakKatakana){
            return false;
        }
        // WB13a: (AHLetter | Numeric | Katakana | ExtendNumLet) × ExtendNumLet
        if ((c1.wordBreakAHLetter || c1.wordBreakNumeric || c1.wordBreakKatakana || c1.wordBreakExtendNumLet) && c2.wordBreakExtendNumLet){
            return false;
        }
        // WB13b: ExtendNumLet × (AHLetter | Numeric | Katakana)
        if (c1.wordBreakExtendNumLet && (c2.wordBreakAHLetter || c2.wordBreakNumeric || c2.wordBreakKatakana)){
            return false;
        }
        // WB13c: Regional_Indicator × Regional_Indicator
        if (c1.wordBreakRegionalIndicator && c2.wordBreakRegionalIndicator){
            return false;
        }
        // WB14: Any ÷ Any
        return true;
    }

});
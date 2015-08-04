// #import "JSKit/JSObject.js"
// #import "Unicode/Unicode.js"
/* global JSClass, JSObject, JSAttributedString, JSRange, JSCopy, UnicodeChar */
'use strict';

JSClass("JSAttributedString", JSObject, {

    _string: null,
    _runs: null,

    init: function(){
        this._string = "";
        var run = {range: JSRange(0, 0), attributes: {}};
        this._runs = [run];
    },

    replaceCharactersInRangeWithString: function(range, string){
        if (range.length > 0){
            this._cutRunsInRange(range);
        }
        if (string.length > 0){
            if (range.location == string.length){
                this._string += string;
            }else{
                this._string = this._string.substr(0, range.location) + string + this._string.substr(range.location + range.length);
            }
            var run;
            for (var i = this._runs.length - 1; i >= 0; --i){
                run = this._runs[i];
                if (run.range.location > range.location){
                    run.range.location += string.length;
                }else{
                    run.range.length += string.length;
                    break;
                }
            }
        }
    },

    deleteCharactersInRange: function(range){
        if (range.length > 0){
            this._string = this._string(0, range.location) + this._string.substr(range.location + range.length);
            this._cutRunsInRange(range);
        }
    },

    setAttributesInRange: function(attributes, range){
        var runRange = this._rangeOfRunsPreparedForChangeInStringRange(range);
        var run = this._runs[runRange.location];
        if (runRange.length > 1){
            var lastRun = this._runs[runRange.location + runRange.length - 1];
            run.range.length = lastRun.range.location + lastRun.length - run.range.location;
            this._runs.splice(runRange.location + 1, runRange.length - 1);
        }
        run.attributes = JSCopy(attributes);
        this._fixRunsInRunRange(JSRange(runRange.location, 1));
    },

    addAttributeInRange: function(attributeName, value, range){
        var runRange = this._rangeOfRunsPreparedForChangeInStringRange(range);
        var run;
        for (var runIndex = runRange.location, l = runRange.location + runRange.length; runIndex < l; ++runIndex){
            run = this._runs[runIndex];
            run.attributes[attributeName] = value;
        }
        this._fixRunsInRunRange(runRange);
    },

    addAttributesInRange: function(attributes, range){
        var runRange = this._rangeOfRunsPreparedForChangeInStringRange(range);
        var run, name;
        for (var runIndex = runRange.location, l = runRange.location + runRange.length; runIndex < l; ++runIndex){
            run = this._runs[runIndex];
            for (name in attributes){
                run.attributes[name] = attributes[name];
            }
        }
        this._fixRunsInRunRange(runRange);
    },

    removeAttributeInRange: function(attributeName, range){
        var runRange = this._rangeOfRunsPreparedForChangeInStringRange(range);
        var run;
        for (var runIndex = runRange.location, l = runRange.location + runRange.length; runIndex < l; ++runIndex){
            run = this._runs[runIndex];
            if (attributeName in run.attributes){
                delete run.attributes[run.attributeName];
            }
        }
        this._fixRunsInRunRange(runRange);
    },

    removeAttributesInRange: function(attributeNames, range){
        var runRange = this._rangeOfRunsPreparedForChangeInStringRange(range);
        var run, name;
        var i, namesLength = attributeNames.length;
        for (var runIndex = runRange.location, l = runRange.location + runRange.length; runIndex < l; ++runIndex){
            run = this._runs[runIndex];
            for (i = 0; i < namesLength; ++i){
                name = attributeNames[i];
                if (name in run.attributes){
                    delete run.attributes[name];
                }
            }
        }
        this._fixRunsInRunRange(runRange);
    },

    removeAllAttributesInRange: function(range){
        var runRange = this._rangeOfRunsPreparedForChangeInStringRange(range);
        var run = this._runs[runRange.location];
        if (runRange.length > 1){
            var lastRun = this._runs[runRange.location + runRange.length - 1];
            run.range.length = lastRun.range.location + lastRun.length - run.range.location;
            this._runs.splice(runRange.location + 1, runRange.length - 1);
        }
        run.attributes = {};
        this._fixRunsInRunRange(JSRange(runRange.location, 1));
    },

    attributesAtIndex: function(index){
        var run = this._runAtStringIndex(index);
        return run.attributes;
    },

    attributeAtIndex: function(attributeName, index){
        var run = this._runAtStringIndex(index);
        return run.attributes[attributeName];
    },

    rangeForWordAtIndex: function(index){
        var L = this._string.length;
        var startIndex = index;
        var endIndex = startIndex + 1;
        while (startIndex > 0 && !this._isWordBoundary(startIndex, L)){
            --startIndex;
        }
        while (endIndex < L && !this._isWordBoundary(endIndex, L)){
            ++endIndex;
        }
        return JSRange(startIndex, endIndex - startIndex);
    },

    _isWordBoundary: function(index, L){
        // See http://www.unicode.org/reports/tr29/
        // FIXME: surrogates (see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/charCodeAt)

        // WB1: sot ÷
        if (index === 0){
            return true;
        }
        // WB1: ÷ eot
        if (index === L){
            return true;
        }
        var c1 = UnicodeChar.fromCode(this._string.charCodeAt(index - 1));
        var c2 = UnicodeChar.fromCode(this._string.charCodeAt(index));
        var c3 = null;
        var c0 = null;
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

        // TODO: WB4: X (Extend | Format)* → X

        // WB5: AHLetter × AHLetter
        if (c1.wordBreakAHLetter && c2.wordBreakAHLetter){
            return false;
        }
        if (index < L - 1){
            c3 = UnicodeChar.fromCode(this._string.charCodeAt(index + 1));
        }
        // WB6: AHLetter × (MidLetter | MidNumLetQ) AHLetter
        if (c3 !== null && c1.wordBreakAHLetter && (c2.wordBreakMidLetter || c2.wordBreakMidNumLetQ) && c3.wordBreakAHLetter){
            return false;
        }
        if (index > 1){
            c0 = UnicodeChar.fromCode(this._string.charCodeAt(index - 2));
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
        // TODO: WB12: Numeric × (MidNum | MidNumLetQ) Numeric
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
    },

    indexOfNextWordFromIndex: function(index){
        var range = this.rangeForWordAtIndex(index);
        index = range.offset + range.length;
        var L = this._string.length;
        var word;
        while (index < L){
            range = this.rangeForWordAtIndex(index);
            word = this._string.substr(range.offset, range.length);
            if (word.match(/[\w]/)){
                return index;
            }
        }
        return L;
    },

    indexOfPreviousWordFromIndex: function(index){
        var range = this.rangeForWordAtIndex(index);
        index = range.offset - 1;
        var word;
        while (index >= 0){
            range = this.rangeForWordAtIndex(index);
            word = this.string.substr(range.offset, range.length);
            if (word.match(/[\w]/)){
                return index;
            }
        }
        return 0;
    },

    _cutRunsInRange: function(range){
        var run;
        var end = range.location + range.length;
        for (var i = this._runs.length - 1; i >= 0; --i){
            run = this._runs[i];
            if (run.range.location >= end){
                run.range.location -= range.length;
            }else if (run.range.location + run.range.length > end){
                if (run.range.location < range.location){
                    run.length -= range.length;
                }else{
                    run.length -= end - run.range.location;
                    run.range.location = range.location;
                }
            }else if (run.range.location >= range.location){
                if (this._runs.length > 1){
                    this._runs.splice(i, 1);
                }else{
                    this._runs[i].length = 0;
                }
            }else if (run.range.location + run.range.length > range.location){
                run.length -= run.range.location + run.range.length - range.location;
            }else{
                break;
            }
        }
    },

    _fixRunsInRunRange: function(runRange){
        var expandedRunRange = JSRange(runRange);
        if (expandedRunRange.location > 0){
            expandedRunRange.location -= 1;
            expandedRunRange.length += 1;
        }
        if (expandedRunRange.location + expandedRunRange.length < this._runs.length - 1){
            expandedRunRange.length += 1;
        }
        var lastRunIndex = runRange.location + runRange.length - 1;
        var runB = this._runs[lastRunIndex];
        var runA;
        for (var runIndex = lastRunIndex - 1; runIndex >= runRange.location; --runIndex){
            runA = this._runs[runIndex];
            // FIXME: verify that this comparison will work the way we want
            // For simple property values, it should, but for complex ones, like JSColor or JSFont, we may need to
            // call an .isEqual() method or something.  Also, verify that object order doesn't matter.  And verify
            // that key differences always result in an inequality.
            if (runA.attributes == runB.attributes){
                this._runs.splice(runIndex, 1);
                runB.location = runA.location;
                runB.length += runA.length;
            }else{
                runB = runA;
            }
        }
    },

    _rangeOfRunsPreparedForChangeInStringRange: function(range){
        var runIndex = this._indexOfFirstRunInRange(range);
        var runRange = JSRange(runIndex, 1);
        var run = this._runs[runIndex];
        var rangeEnd = range.location + range.length;
        var runEnd;
        if (run.range.location < range.location){
            // run starts before reange...split the run into two
            // The first part is shorted to end where the range starts
            runEnd = run.range.location + run.range.length;
            run.range.length = range.location - run.range.location;
            // A new run is inserted to cover until the original end of the first run
            run = {range: JSRange(range.location, runEnd - range.location), attributes: JSCopy(run.attributes)};
            runRange.location++;
            ++runIndex;
            this._runs.splice(runIndex, 0, run);
            if (runEnd < rangeEnd){
                // If there's still more to the range, iterate to the next run and continue below...
                ++runIndex;
                run = this._runs[runIndex];
                runRange.length++;
            }
        }
        do {
            runEnd = run.range.location + run.range.length;
            run.attributes = {};
            if (runEnd < rangeEnd){
                // Range is longer than this run...iterate to the next run
                ++runIndex;
                run = this._runs[runIndex];
                runRange.length++;
            }else if (runEnd > rangeEnd){
                // Run is longer than range...split the run into two
                // First, move the current run forward and shrink it by range.length, becoming the second half of the split
                run.range.length -= range.length;
                run.range.location += range.length;
                // Then, insert a new run starting where the second half used to start, extending to the rangeEnd
                run = {range: JSRange(run.range.location - range.length, rangeEnd - run.range.location), attributes: JSCopy(run.attributes)};
                this._runs.splice(runIndex, 0, run);
            }
        } while (run.range.location + run.range.length < rangeEnd);
        return runRange;
    },

    _runAtStringIndex: function(index){
        var runIndex = this._indexOfFirstRunInRange(JSRange(index, 0));
        return this._runs[runIndex];
    },

    _indexOfFirstRunInRange: function(range){
        var low = 0;
        var high = this._runs.length - 1;
        var mid;
        var run;
        var i;
        var l = this._runs.length;
        var start = range.location;
        var end = range.location + range.length;
        while (low <= high){
            mid = low + Math.floor((high - low) / 2);
            run = this._runs[mid];
            if (run.range.location + run.range.length < start){
                low = mid + 1;
            }else if (run.range.location > end){
                high = mid;
            }else{
                i = mid - 1;
                while (i >= 0 && this._runs[i].range.location + this._runs[i].range.length <= start){
                    --i;
                }
                return i + 1;
            }
        }
    }

});
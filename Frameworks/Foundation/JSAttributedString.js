// #import "Foundation/JSString.js"
/* global JSClass, JSString, JSAttributedString, JSRange, JSCopy */
'use strict';

JSClass("JSAttributedString", JSString, {

    _runs: null,

    init: function(){
        JSAttributedString.$super.init.call(this);
        var run = {range: JSRange(0, 0), attributes: {}};
        this._runs = [run];
    },

    replaceCharactersInRangeWithString: function(range, string){
        if (typeof(string) == "string"){
            string = JSString.initWithNativeString(string);
        }
        JSAttributedString.$super.replaceCharactersInRangeWithString.call(this, range, string);
        if (range.length > 0){
            this._cutRunsInRange(range);
        }
        if (string.length > 0){
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
        JSAttributedString.$super.deleteCharactersInRange.call(this, range);
        if (range.length > 0){
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
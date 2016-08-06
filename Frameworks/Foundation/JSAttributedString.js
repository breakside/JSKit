// #import "Foundation/JSString.js"
/* global JSClass, JSReadOnlyProperty, JSObject, JSString, JSAttributedString, JSRange, JSCopy */
'use strict';

JSClass("JSAttributedString", JSObject, {

    _runs: null,
    string: JSReadOnlyProperty('_string', null),

    init: function(){
        this.initWithString("", {});
    },

    initWithString: function(string, attributes){
        if (typeof(string) == "string"){
            string = JSString.initWithNativeString(string);
        }
        if (attributes === undefined){
            attributes = {};
        }
        var run = {range: JSRange(0, string.length), attributes: attributes};
        this._string = string;
        this._runs = [run];
    },

    getString: function(){
        return this._string;
    },

    appendString: function(string){
        this.replaceCharactersInRangeWithString(JSRange(this._string.length, 0), string);
    },

    deleteCharactersInRange: function(range){
        this.replaceCharactersInRangeWithString(range, "");
    },

    replaceCharactersInRangeWithString: function(range, string){
        this._string.replaceCharactersInRangeWithString(range, string);
        var run;
        var runIndex;
        var l;
        if (range.length > 0){
            // For the delete case, we cut out any runs within the range
            // But we remember the attributes of the first run in the range,
            // because those attributes will be used for the inserted text.
            // This attibute usage seems to match a typical editor behavior.
            var runRange = this._rangeOfRunsPreparedForChangeInStringRange(range);
            var attributes = this._runs[runRange.location].attributes;
            this._runs.splice(runRange.location, runRange.length);
            if (string.length > 0){
                // If text is being inserted, add a new range with the attributes previously saved
                run = {range: JSRange(range.location, string.length), attributes: attributes};
                this._runs.splice(runRange.location, 0, run);
                // Adjust following run locations
                var locationAdjustment = string.length - range.length;
                for (runIndex = runRange.location + 1, l = this._runs.length; runIndex < l; ++runIndex){
                    this._runs[runIndex].location += locationAdjustment;
                }
            }else{
                // If we cut out all the runs, make sure to add an empty initial run back
                if (this._runs.length === 0){
                    this._runs = [{range: JSRange(0, 0), attributes: attributes}];
                }
            }
        }else if (string.length > 0){
            // For a simple insert case, where nothing is deleted, all we have to
            // do is extend the range that immediately precedes the insertion point
            // We use the preceding range because this matches the typical editor behavior
            // when typing at the end of a run.
            var index = range.location > 0 ? range.location - 1 : 0;
            runIndex = this._runIndexForStringIndex(index);
            run = this._runs[runIndex];
            run.range.length += string.length;
            ++runIndex;
            for (l = this._runs.length; runIndex < l; ++runIndex){
                this._runs[runIndex].range.location += string.length;
            }
        }
    },

    setAttributesInRange: function(attributes, range){
        var runRange = this._rangeOfRunsPreparedForChangeInStringRange(range);
        var run;
        for (var runIndex = runRange.location, l = runRange.location + runRange.length; runIndex < l; ++runIndex){
            run = this._runs[runIndex];
            run.attributes = JSCopy(attributes);
        }
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
                delete run.attributes[attributeName];
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
        var run;
        for (var runIndex = runRange.location, l = runRange.location + runRange.length; runIndex < l; ++runIndex){
            run = this._runs[runIndex];
            run.attributes = {};
        }
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
        var runIndex = this._runIndexForStringIndex(range.location);
        var runRange = JSRange(runIndex, 1);
        var run = this._runs[runIndex];
        var rangeEnd = range.location + range.length;
        var runEnd;
        if (run.range.location < range.location){
            // run starts before range...split the run into two
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
            if (runEnd < rangeEnd){
                // Range is longer than this run...iterate to the next run
                ++runIndex;
                run = this._runs[runIndex];
                runRange.length++;
            }else if (runEnd > rangeEnd){
                var remainingRangeLength = rangeEnd - run.range.location;
                // Run is longer than range...split the run into two
                // First, move the current run forward and shrink it by range.length, becoming the second half of the split
                run.range.length -= remainingRangeLength;
                run.range.location += remainingRangeLength;
                // Then, insert a new run starting where the second half used to start, extending to the rangeEnd
                run = {range: JSRange(run.range.location - remainingRangeLength, remainingRangeLength), attributes: JSCopy(run.attributes)};
                this._runs.splice(runIndex, 0, run);
            }
        } while (run.range.location + run.range.length < rangeEnd);
        return runRange;
    },

    _runAtStringIndex: function(index){
        var runIndex = this._runIndexForStringIndex(index);
        return this._runs[runIndex];
    },

    _runIndexForStringIndex: function(index){
        var low = 0;
        var high = this._runs.length - 1;
        var mid;
        var run;
        var i;
        var l = this._runs.length;
        while (low < high){
            mid = low + Math.floor((high - low) / 2);
            run = this._runs[mid];
            if (index < run.range.location){
                high = mid - 1;
            }else if (index >= run.range.location + run.range.length){
                low = mid + 1;
            }else{
                return mid;
            }
        }
        return high;
    }

});
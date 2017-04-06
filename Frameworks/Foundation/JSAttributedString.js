// #import "Foundation/JSObject.js"
/* global JSClass, JSReadOnlyProperty, JSObject, JSAttributedString, JSRange, JSCopy */
'use strict';

function JSAttributedStringRun(range, attributes){
    if (this === undefined){
        return new JSAttributedStringRun(range, attributes);
    }else{
        if (range instanceof JSAttributedStringRun){
            this.range = JSRange(range.range);
            this.attributes = JSCopy(range.attributes);
        }else{
            this.range = JSRange(range);
            this.attributes = JSCopy(attributes);
        }
    }
}

JSAttributedStringRun.prototype = {

    hasIdenticalAttributes: function(other){
        var attribute;
        var a, b;
        for (attribute in this.attributes){
            if (attribute in other.attributes){
                a = this.attributes[attribute];
                b = other.attributes[attribute];
                if (a.isEqual){
                    if (!a.isEqual(b)){
                        return false;
                    }
                }else if (b.isEqual){
                    if (!b.isEqual(a)){
                        return false;
                    }
                }else if (a != b){
                    return false;
                }
            }else{
                return false;
            }
        }
        for (attribute in other.attributes){
            if (!(attribute in this.attributes)){
                return false;
            }
        }
    }

};

JSClass("JSAttributedString", JSObject, {

    _runs: null,
    string: JSReadOnlyProperty('_string', null),

    // MARK: - Creating an attributed string

    init: function(){
        this.initWithString("", {});
    },

    initWithString: function(string, attributes){
        if (attributes === undefined){
            attributes = {};
        }
        var run = JSAttributedStringRun(JSRange(0, string.length), attributes);
        this._string = string;
        this._runs = [run];
    },

    initWithAttributedString: function(attributedString){
        this._string = attributedString.string;
        this._runs = [];
        var run;
        for (var i = 0, l = attributedString._runs.length; i < l; ++i){
            run = attributedString._runs[i];
            this._runs.push(JSAttributedStringRun(run));
        }
    },

    // MARK: - Getting the unattributed string value

    getString: function(){
        return this._string;
    },

    // MARK: - String mutations

    appendString: function(string){
        this.replaceCharactersInRangeWithString(JSRange(this._string.length, 0), string);
    },

    deleteCharactersInRange: function(range){
        this.replaceCharactersInRangeWithString(range, "");
    },

    replaceCharactersInRangeWithString: function(range, string){
        this._string = this._string.stringByReplacingCharactersInRangeWithString(range, string);
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
                run = JSAttributedStringRun(JSRange(range.location, string.length), attributes);
                this._runs.splice(runRange.location, 0, run);
                // Adjust following run locations
                var locationAdjustment = string.length - range.length;
                for (runIndex = runRange.location + 1, l = this._runs.length; runIndex < l; ++runIndex){
                    this._runs[runIndex].range.location += locationAdjustment;
                }
                this._fixRunsInRunRange(JSRange(runRange.location, 1));
            }else{
                // If we cut out all the runs, make sure to add an empty initial run back
                if (this._runs.length === 0){
                    this._runs = [JSAttributedStringRun(JSRange(0, 0), attributes)];
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

    // MARK: - Attribute mutations

    setAttributesInRange: function(attributes, range){
        var runRange = this._rangeOfRunsPreparedForChangeInStringRange(range);
        var run;
        for (var runIndex = runRange.location, l = runRange.end; runIndex < l; ++runIndex){
            run = this._runs[runIndex];
            run.attributes = JSCopy(attributes);
        }
        this._fixRunsInRunRange(JSRange(runRange.location, 1));
    },

    addAttributeInRange: function(attributeName, value, range){
        var runRange = this._rangeOfRunsPreparedForChangeInStringRange(range);
        var run;
        for (var runIndex = runRange.location, l = runRange.end; runIndex < l; ++runIndex){
            run = this._runs[runIndex];
            run.attributes[attributeName] = value;
        }
        this._fixRunsInRunRange(runRange);
    },

    addAttributesInRange: function(attributes, range){
        var runRange = this._rangeOfRunsPreparedForChangeInStringRange(range);
        var run, name;
        for (var runIndex = runRange.location, l = runRange.end; runIndex < l; ++runIndex){
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
        for (var runIndex = runRange.location, l = runRange.end; runIndex < l; ++runIndex){
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
        for (var runIndex = runRange.location, l = runRange.end; runIndex < l; ++runIndex){
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
        for (var runIndex = runRange.location, l = runRange.end; runIndex < l; ++runIndex){
            run = this._runs[runIndex];
            run.attributes = {};
        }
        this._fixRunsInRunRange(JSRange(runRange.location, 1));
    },

    // MARK: - Querying attribute values

    attributesAtIndex: function(index){
        var run = this._runAtStringIndex(index);
        return run.attributes;
    },

    attributeAtIndex: function(attributeName, index){
        var run = this._runAtStringIndex(index);
        return run.attributes[attributeName];
    },

    rangeOfRunAtIndex: function(index){
        var run = this._runAtStringIndex(index);
        return run.range;
    },

    // MARK: - Private helpers

    _fixRunsInRunRange: function(runRange){
        var expandedRunRange = JSRange(runRange);
        if (expandedRunRange.location > 0){
            expandedRunRange.location -= 1;
            expandedRunRange.length += 1;
        }
        if (expandedRunRange.end < this._runs.length - 1){
            expandedRunRange.length += 1;
        }
        var lastRunIndex = runRange.end - 1;
        var runB = this._runs[lastRunIndex];
        var runA;
        for (var runIndex = lastRunIndex - 1; runIndex >= runRange.location; --runIndex){
            runA = this._runs[runIndex];
            if (runA.hasIdenticalAttributes(runB)){
                this._runs.splice(runIndex, 1);
                runB.range.location = runA.range.location;
                runB.range.length += runA.range.length;
            }else{
                runB = runA;
            }
        }
    },

    _rangeOfRunsPreparedForChangeInStringRange: function(range){
        var firstRunIndex = this._splitRunAtIndex(range.location);
        if (range.length > 0){
            var lastRunIndex = this._splitRunAtIndex(range.end);
            return JSRange(firstRunIndex, lastRunIndex - firstRunIndex);
        }else{
            return JSRange(firstRunIndex, 1);
        }
    },

    _splitRunAtIndex: function(index){
        var runIndex = this._runIndexForStringIndex(index);
        var run = this._runs[runIndex];
        // If we aren't at the start of the run
        if (run.range.location < index){
            // ... we'll want to return the next run index
            ++runIndex;
            // ... and create a new range if we aren't at the run's end
            // (_runIndexForStringIndex will return the last run if given an index == _string.length,
            // which is the only case where index will be at the run's ending boundary)
            var originalEnd = run.range.end;
            if (originalEnd > index){
                run.range.length = index - run.range.location;
                run = JSAttributedStringRun(JSRange(index, originalEnd - index), run.attributes);
                this._runs.splice(runIndex, 0, run);
            }
        }
        return runIndex;
    },

    _runAtStringIndex: function(index){
        var runIndex = this._runIndexForStringIndex(index);
        return this._runs[runIndex];
    },

    _runIndexForStringIndex: function(index){
        var low = 0;
        var high = this._runs.length;
        var mid;
        var run;
        var i = 0;
        var l = this._runs.length;
        while (low < high){
            mid = low + Math.floor((high - low) / 2);
            run = this._runs[mid];
            if (index < run.range.location){
                high = mid;
            }else if (index >= run.range.end){
                low = mid + 1;
            }else{
                low = high = mid;
            }
        }
        if (high == this._runs.length){
            return high - 1;
        }
        return high;
    }

});

JSAttributedString.Attribute = {
    Font: "font",
    TextColor: "textColor",
    BackgroundColor: "backgroundColor",
    Bold: "bold",
    Italic: "italic",
    Underline: "underline",
    Strike: "strike",
    Attachment: "attachment"
};

JSAttributedString.SpecialCharacter = {
    Attachment: 0xFFFC
};
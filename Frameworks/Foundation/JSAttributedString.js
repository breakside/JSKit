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

// #import "Javascript.js"
// #import "JSObject.js"
// #import "JSTextAttachment.js"
'use strict';

(function(){

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

    initWithAttributedString: function(attributedString, defaultAttributes){
        this._string = attributedString.string;
        this._runs = [];
        var run;
        for (var i = 0, l = attributedString._runs.length; i < l; ++i){
            run = attributedString._runs[i];
            this._runs.push(JSAttributedStringRun(run, defaultAttributes));
        }
    },

    initWithAttachment: function(attachment){
        var attributes = {};
        attributes[JSAttributedString.Attribute.attachment] = attachment;
        this.initWithString(JSAttributedString.SpecialCharacter.attachmentUTF16, attributes);
    },

    initWithImageAttachmentName: function(name, size){
        var attachment = JSTextAttachment.initWithImageName(name, size);
        this.initWithAttachment(attachment);
    },

    // MARK: - Getting the unattributed string value

    getString: function(){
        return this._string;
    },

    // MARK: - Substrings

    attributedSubstringInRange: function(range){
        var other = JSAttributedString.initWithAttributedString(this);
        var end = range.end;
        var trailing = other.string.length - end;
        if (trailing > 0){
            other.deleteCharactersInRange(JSRange(end, trailing));
        }
        if (range.location > 0){
            other.deleteCharactersInRange(JSRange(0, range.location));
        }
        return other;
    },

    // MARK: - String mutations

    appendString: function(string){
        this.replaceCharactersInRangeWithString(JSRange(this._string.length, 0), string);
    },

    appendAttributedString: function(attributedString){
        this.replaceCharactersInRangeWithAttributedString(JSRange(this._string.length, 0), attributedString);
    },

    appendAttachment: function(attachment){
        this.insertAttachment(attachment, this.string.length);
    },

    insertString: function(string, index){
        this.replaceCharactersInRangeWithString(JSRange(index, 0), string);
    },

    insertAttributedString: function(attributedString, index){
        this.replaceCharactersInRangeWithAttributedString(JSRange(index, 0), attributedString);
    },

    insertAttachment: function(attachment, index){
        var attachmentString = JSAttributedString.initWithAttachment(attachment);
        this.insertAttributedString(attachmentString, index);
    },

    deleteCharactersInRange: function(range){
        this.replaceCharactersInRangeWithString(range, "");
    },

    replaceCharactersInRangeWithString: function(range, string){
        var insertAttributes = {};
        if (string.length > 0){
            if (range.length > 0 || range.location === 0){
                insertAttributes = JSCopy(this.attributesAtIndex(range.location));
            }else{
                insertAttributes = JSCopy(this.attributesAtIndex(range.location - 1));
            }
        }else if (range.location === 0 && range.length == this.string.length){
            insertAttributes = JSCopy(this.attributesAtIndex(range.location));
        }
        if (JSAttributedString.Attribute.attachment in insertAttributes){
            delete insertAttributes[JSAttributedString.Attribute.attachment];
        }
        this.replaceCharactersInRangeWithAttributedString(range, JSAttributedString.initWithString(string, insertAttributes));

        // this._string = this._string.stringByReplacingCharactersInRangeWithString(range, string);
        // var run;
        // var runIndex;
        // var l;
        // var locationAdjustment = string.length - range.length;
        // var fixRange = JSRange.Zero;
        // if (range.length > 0){
        //     // For the delete case, we cut out any runs within the range
        //     // But we remember the attributes of the first run in the range,
        //     // because those attributes will be used for the inserted text.
        //     // This attibute usage seems to match a typical editor behavior.
        //     var runRange = this._rangeOfRunsPreparedForChangeInStringRange(range);
        //     var attributes = this._runs[runRange.location].attributes;
        //     this._runs.splice(runRange.location, runRange.length);
        //     runIndex = runRange.location;
        //     if (string.length > 0){
        //         // If text is being inserted, add a new range with the attributes previously saved
        //         run = JSAttributedStringRun(JSRange(range.location, string.length), attributes);
        //         this._runs.splice(runIndex, 0, run);
        //         ++runIndex;
        //     }else{
        //         // If we cut out all the runs, make sure to add an empty initial run back
        //         if (this._runs.length === 0){
        //             this._runs = [JSAttributedStringRun(JSRange(0, 0), attributes)];
        //             return;
        //         }
        //     }
        //     fixRange.location = runIndex;
        //     if (runIndex < this._runs.length){
        //         fixRange.length = 1;
        //     }
        // }else if (string.length > 0){
        //     // For a simple insert case, where nothing is deleted, all we have to
        //     // do is extend the range that immediately precedes the insertion point
        //     // We use the preceding range because this matches the typical editor behavior
        //     // when typing at the end of a run.
        //     var index = range.location > 0 ? range.location - 1 : 0;
        //     runIndex = this._runIndexForStringIndex(index);
        //     run = this._runs[runIndex];
        //     run.range.length += string.length;
        //     ++runIndex;
        // }
        // if (locationAdjustment !== 0){
        //     // Adjust following run locations
        //     for (l = this._runs.length; runIndex < l; ++runIndex){
        //         this._runs[runIndex].range.location += locationAdjustment;
        //     }
        // }
        // if (fixRange.length > 0){
        //     this._fixRunsInRunRange(fixRange);
        // }
    },

    replaceCharactersInRangeWithAttributedString: function(range, attributedString){
        if (attributedString === null){
            attributedString = JSAttributedString.init();
        }
        var runRange = this._rangeOfRunsPreparedForChangeInStringRange(range);
        if (range.length > 0 || this._string.length === 0){
            this._runs.splice(runRange.location, runRange.length);
        }
        this._string = this._string.stringByReplacingCharactersInRangeWithString(range, attributedString.string);
        var runLocationAdjustment = range.location;
        var runIndex = runRange.location;
        var run;
        var copiedRun;
        var i, l;
        if (attributedString.string.length > 0 || this._runs.length === 0){
            for (i = 0, l = attributedString._runs.length; i < l; ++i){
                run = attributedString._runs[i];
                copiedRun = JSAttributedStringRun(JSRange(run.range.location + runLocationAdjustment, run.range.length), run.attributes);
                this._runs.splice(runIndex, 0, copiedRun);
                ++runIndex;
            }
        }
        var locationAdjustment = attributedString.string.length - range.length;
        if (locationAdjustment !== 0){
            for (i = runIndex, l = this._runs.length; i < l; ++i){
                run = this._runs[i];
                run.range.location += locationAdjustment;
            }
        }
        this._fixRunsAtIndex(runIndex);
        this._fixRunsAtIndex(runRange.location);
    },

    // MARK: - Attribute mutations

    setAttributesInRange: function(attributes, range){
        var runRange = this._rangeOfRunsPreparedForChangeInStringRange(range);
        var run = this._runs[runRange.location];
        run.attributes = JSCopy(attributes);
        if (runRange.length > 1){
            run.range.length = this._runs[runRange.end - 1].end - run.range.location;
            this._runs.splice(runRange.location + 1, runRange.length - 1);
        }
        this._fixRunsInRunRange(JSRange(runRange.location, 1));
    },

    addAttributeInRange: function(attributeName, value, range){
        var attributes = {};
        attributes[attributeName] = value;
        this.addAttributesInRange(attributes, range);
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
        this.removeAttributesInRange([attributeName], range);
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
        this.setAttributesInRange({}, range);
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

    runIterator: function(index){
        if (index === undefined){
            index = 0;
        }
        return new JSAttributedStringRunIterator(this, index);
    },

    // MARK: - Formatting

    replaceFormat: function(){
        var args = [];
        var attributes = [];
        for (var i = 0, l = arguments.length; i < l; i += 2){
            args.push(arguments[i]);
            attributes.push(arguments[i + 1]);
        }
        var parser = String.FormatParser(this.string, String.printf_formatter, args);
        var attributedString = this;
        var adjustment = 0;
        parser.delegate = {
            parserFoundReplacementInRange: function(parser, replacement, range, argIndex){
                range = JSRange(range);
                range.location += adjustment;
                attributedString.replaceCharactersInRangeWithString(range, replacement);
                adjustment += replacement.length - range.length;
                if (argIndex >= 0){
                    var attrs = attributes[argIndex];
                    if (attrs){
                        attributedString.addAttributesInRange(attrs, JSRange(range.location, replacement.length));
                    }
                }
            },
        };
        parser.parse();
    },

    // MARK: - Private helpers

    _fixRunsInRunRange: function(runRange){
        var expandedRunRange = JSRange(runRange);
        if (expandedRunRange.location > 0){
            expandedRunRange.location -= 1;
            expandedRunRange.length += 1;
        }
        if (expandedRunRange.end < this._runs.length){
            expandedRunRange.length += 1;
        }
        var lastRunIndex = expandedRunRange.end - 1;
        var runB = this._runs[lastRunIndex];
        var runA;
        for (var runIndex = lastRunIndex - 1; runIndex >= expandedRunRange.location; --runIndex){
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

    _fixRunsAtIndex: function(runIndex){
        if (runIndex === 0){
            return;
        }
        if (runIndex === this._runs.length){
            return;
        }
        var runA = this._runs[runIndex - 1];
        var runB = this._runs[runIndex];
        if (runA.hasIdenticalAttributes(runB)){
            this._runs.splice(runIndex, 1);
            runA.range.length += runB.range.length;
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
    font: "font",
    textColor: "textColor",
    backgroundColor: "backgroundColor",
    bold: "bold",
    italic: "italic",
    underline: "underline",
    strike: "strike",
    attachment: "attachment",
    lineHeight: "lineHeight",
    lineSpacing: "lineSpacing",
    textAlignment: "textAlignment",
    lineBreakMode: "lineBreakMode",
    maskCharacter: "maskCharacter",
    cursor: "cursor",
    link: "link"
};

JSAttributedString.SpecialCharacter = {
    attachment: 0xFFFC,
    attachmentUTF16: "\uFFFC"
};

function JSAttributedStringRun(range, attributes){
    if (this === undefined){
        return new JSAttributedStringRun(range, attributes);
    }else{
        if (range instanceof JSAttributedStringRun){
            this.range = JSRange(range.range);
            this.attributes = JSCopy(range.attributes);
            if (attributes !== undefined){
                for (var attr in attributes){
                    if (!(attr in this.attributes)){
                        this.attributes[attr] = attributes[attr];
                    }
                }
            }
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
        return true;
    }

};

var JSAttributedStringRunIterator = function(attributedString, startIndex){
    if (this === undefined){
        return new JSAttributedStringRunIterator(attributedString, startIndex);
    }
    this._attributedString = attributedString;
    this._runIndex = this._attributedString._runIndexForStringIndex(startIndex);
};

Object.defineProperties(JSAttributedStringRunIterator.prototype, {
    range: {
        enumerable: true,
        configurable: false,
        get: function JSAttributedStringRunIterator_getRange(){
            if (this._runIndex < 0){
                return JSRange(-1, 0);
            }
            if (this._runIndex >= this._attributedString._runs.length){
                return JSRange(this._attributedString.string.length, 0);
            }
            return this._attributedString._runs[this._runIndex].range;
        }
    },

    attributes: {
        enumerable: true,
        configurable: false,
        get: function JSAttributedStringRunIterator_getAttributes(){
            if (this._runIndex < 0){
                return {};
            }
            if (this._runIndex >= this._attributedString._runs.length){
                return {};
            }
            return this._attributedString._runs[this._runIndex].attributes;
        }
    },

    increment: {
        enumerable: false,
        configurable: false,
        value: function JSAttributedStringRunIterator_increment(){
            if (this._runIndex < this._attributedString._runs.length){
                ++this._runIndex;
            }
        }
    },

    decrement: {
        enumerable: false,
        configurable: false,
        value: function JSAttributedStringRunIterator_decrement(){
            if (this._runIndex >= 0){
                --this._runIndex;
            }
        }
    },

    attachment: {
        enumerable: false,
        configurable: false,
        get: function JSAttributedStringRunIterator_getAttachment(){
            if (this._runIndex < 0){
                return null;
            }
            if (this._runIndex >= this._attributedString._runs.length){
                return null;
            }
            var run = this._attributedString._runs[this._runIndex];
            if (run.range.length === 1 && this._attributedString.charCodeAt(run.range.location) === JSAttributedString.SpecialCharacter.attachment){
                return run.attributes[JSAttributedString.Attribute.attachment];
            }
            return null;
        }
    }
});

})();
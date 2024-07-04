// #import "JSObject.js"
// #import "CoreTypes.js"
"use strict";

JSClass("JSParagraphStyle", JSObject, {

    textAlignment: JSTextAlignment.left,
    lineBreakMode: JSLineBreakMode.truncateTail,
    lineSpacing: 0,
    minimumLineHeight: 0,
    lineHeightMultiple: 0,
    paragraphSpacing: 0,
    beforeParagraphSpacing: 0,
    firstLineHeadIndent: 0,
    headIndent: 0,
    tailIndent: 0,
    listLevel: 0,
    listIndent: 0,
    listMarker: null,
    listMarkerWidth: 18,
    listStartingNumber: null,

    init: function(){
    },

    styleWithAttributes: function(attributes){
        var style = this.copy();
        if (attributes.textAlignment !== undefined){
            style.textAlignment = attributes.textAlignment;
        }
        if (attributes.lineBreakMode !== undefined){
            style.lineBreakMode = attributes.lineBreakMode;
        }
        if (attributes.lineSpacing !== undefined){
            style.lineSpacing = attributes.lineSpacing;
        }
        if (attributes.minimumLineHeight !== undefined){
            style.minimumLineHeight = attributes.minimumLineHeight;
        }
        if (attributes.lineHeightMultiple !== undefined){
            style.lineHeightMultiple = attributes.lineHeightMultiple;
        }
        if (attributes.paragraphSpacing !== undefined){
            style.paragraphSpacing = attributes.paragraphSpacing;
        }
        if (attributes.beforeParagraphSpacing !== undefined){
            style.beforeParagraphSpacing = attributes.beforeParagraphSpacing;
        }
        if (attributes.firstLineHeadIndent !== undefined){
            style.firstLineHeadIndent = attributes.firstLineHeadIndent;
        }
        if (attributes.headIndent !== undefined){
            style.headIndent = attributes.headIndent;
        }
        if (attributes.tailIndent !== undefined){
            style.tailIndent = attributes.tailIndent;
        }
        if (attributes.listLevel !== undefined){
            style.listLevel = attributes.listLevel;
        }
        if (attributes.listIndent !== undefined){
            style.listIndent = attributes.listIndent;
        }
        if (attributes.listMarker !== undefined){
            style.listMarker = attributes.listMarker;
        }
        if (attributes.listMarkerWidth !== undefined){
            style.listMarkerWidth = attributes.listMarkerWidth;
        }
        if (attributes.listStartingNumber !== undefined){
            style.listStartingNumber = attributes.listStartingNumber;
        }
        return style;
    },

    copy: function(){
        var style = JSParagraphStyle.init();
        style.textAlignment = this.textAlignment;
        style.lineBreakMode = this.lineBreakMode;
        style.lineSpacing = this.lineSpacing;
        style.minimumLineHeight = this.minimumLineHeight;
        style.lineHeightMultiple = this.lineHeightMultiple;
        style.paragraphSpacing = this.paragraphSpacing;
        style.beforeParagraphSpacing = this.beforeParagraphSpacing;
        style.firstLineHeadIndent = this.firstLineHeadIndent;
        style.headIndent = this.headIndent;
        style.tailIndent = this.tailIndent;
        style.listLevel = this.listLevel;
        style.listIndent = this.listIndent;
        style.listMarker = this.listMarker;
        style.listMarkerWidth = this.listMarkerWidth;
        style.listStartingNumber = this.listStartingNumber;
        return style;
    },

    markerTextForListItemNumber: function(n){
        if (this.listMarker === "1" || this.listMarker === "1." || this.listMarker === "1)" || this.listMarker === "(1)"){
            return "%s%d%s".sprintf(
                this.listMarker.length === 3 ? this.listMarker[0] : "",
                n,
                this.listMarker.length === 1 ? "." : this.listMarker[this.listMarker.length - 1]
            );
        }
        if (this.listMarker === "a" || this.listMarker === "A" || this.listMarker === "a." || this.listMarker === "A." || this.listMarker === "a)" || this.listMarker === "A)" || this.listMarker === "(a)" || this.listMarker === "(A)"){
            var aCode = this.listMarker.charCodeAt(this.listMarker.length === 3 ? 1 : 0);
            var text = "";
            if (this.listMarker.length === 3){
                text += this.listMarker[0];
            }
            while (n > 0){
                text += String.fromCharCode(aCode + ((n - 1) % 26));
                n -= 26;
            }
            if (this.listMarker.length == 1){
                text += ".";
            }else{
                text += this.listMarker[this.listMarker.length - 1];
            }
            return text;
        }
        if (this.listMarker !== null){
            return this.listMarker;
        }
        return "•";
    },

});

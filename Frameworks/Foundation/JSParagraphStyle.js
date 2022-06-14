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
        return style;
    }

});
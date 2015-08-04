// #import "Unicode/UnicodeProperties.js"
/* global UnicodeProperties */
'use strict';

function UnicodeChar(code){
    if (this === undefined){
        if (!(code in UnicodeChar.database)){
            UnicodeChar.database[code] = new UnicodeChar(code);
        }
        return UnicodeChar.database[code];
    }
    this.code = code;
}

UnicodeChar.database = {};

UnicodeChar.prototype = Object.create(Object.prototype, {

    generalCategoryIsOtherLetter: {
        configurable: true,
        get: function UnicodeChar_lazy_generalCategoryIsOtherLetter(){
            Object.defineProperty(this, 'generalCategoryIsOtherLetter', {value: UnicodeProperties.isGeneralCategory(this.code, 'Other_Letter')});
            if (this.generalCategoryIsOtherLetter){
                Object.defineProperty(this, 'generalCategoryIsConnectorPunctuation', {value: false});
                Object.defineProperty(this, 'generalCategoryIsSpacingMark', {value: false});
                Object.defineProperty(this, 'generalCategoryIsFormat', {value: false});
            }
            return this.generalCategoryIsOtherLetter;
        }
    },

    generalCategoryIsConnectorPunctuation: {
        configurable: true,
        get: function UnicodeChar_lazy_generalCategoryIsConnectorPunctuation(){
            Object.defineProperty(this, 'generalCategoryIsConnectorPunctuation', {value: UnicodeProperties.isGeneralCategory(this.code, 'Connector_Punctuation')});
            if (this.generalCategoryIsConnectorPunctuation){
                Object.defineProperty(this, 'generalCategoryIsOtherLetter', {value: false});
                Object.defineProperty(this, 'generalCategoryIsSpacingMark', {value: false});
                Object.defineProperty(this, 'generalCategoryIsFormat', {value: false});
            }
            return this.generalCategoryIsConnectorPunctuation;
        }
    },

    generalCategoryIsSpacingMark: {
        configurable: true,
        get: function UnicodeChar_lazy_generalCategoryIsSpacingMark(){
            Object.defineProperty(this, 'generalCategoryIsSpacingMark', {value: UnicodeProperties.isGeneralCategory(this.code, 'Spacing_Mark')});
            if (this.generalCategoryIsSpacingMark){
                Object.defineProperty(this, 'generalCategoryIsOtherLetter', {value: false});
                Object.defineProperty(this, 'generalCategoryIsConnectorPunctuation', {value: false});
                Object.defineProperty(this, 'generalCategoryIsFormat', {value: false});
            }
            return this.generalCategoryIsSpacingMark;
        }
    },

    generalCategoryIsFormat: {
        configurable: true,
        get: function UnicodeChar_lazy_generalCategoryIsFormat(){
            Object.defineProperty(this, 'generalCategoryIsFormat', {value: UnicodeProperties.isGeneralCategory(this.code, 'Format')});
            if (this.generalCategoryIsFormat){
                Object.defineProperty(this, 'generalCategoryIsOtherLetter', {value: false});
                Object.defineProperty(this, 'generalCategoryIsConnectorPunctuation', {value: false});
                Object.defineProperty(this, 'generalCategoryIsSpacingMark', {value: false});
            }
            return this.generalCategoryIsFormat;
        }
    },

    scriptIsHiragana: {
        configurable: true,
        get: function UnicodeChar_lazy_scriptIsHiragana(){
            Object.defineProperty(this, 'scriptIsHiragana', {value: UnicodeProperties.isScript(this.code, 'Hiragana')});
            if (this.scriptIsHiragana){
                Object.defineProperty(this, 'scriptIsHebrew', {value: false});
                Object.defineProperty(this, 'scriptIsKatakana', {value: false});
            }
            return this.scriptIsHiragana;
        }
    },

    scriptIsHebrew: {
        configurable: true,
        get: function UnicodeChar_lazy_scriptIsHebrew(){
            Object.defineProperty(this, 'scriptIsHebrew', {value: UnicodeProperties.isScript(this.code, 'Hebrew')});
            if (this.scriptIsHebrew){
                Object.defineProperty(this, 'scriptIsHiragana', {value: false});
                Object.defineProperty(this, 'scriptIsKatakana', {value: false});
            }
            return this.scriptIsHebrew;
        }
    },

    scriptIsKatakana: {
        configurable: true,
        get: function UnicodeChar_lazy_scriptIsKatakana(){
            Object.defineProperty(this, 'scriptIsKatakana', {value: UnicodeProperties.isScript(this.code, 'Katakana')});
            if (this.scriptIsKatakana){
                Object.defineProperty(this, 'scriptIsHebrew', {value: false});
                Object.defineProperty(this, 'scriptIsHiragana', {value: false});
            }
            return this.scriptIsKatakana;
        }
    },

    lineBreakIsComplexContext: {
        configurable: true,
        get: function UnicodeChar_lazy_lineBreakIsComplexContext(){
            Object.defineProperty(this, 'lineBreakIsComplexContext', {value: UnicodeProperties.isLineBreak(this.code, 'Complex_Context')});
            if (this.lineBreakIsComplexContext){
                Object.defineProperty(this, 'lineBreakIsInfixNumeric', {value: false});
                Object.defineProperty(this, 'lineBreakIsNumeric', {value: false});
                Object.defineProperty(this, 'lineBreakIsQuotation', {value: false});
            }
            return this.lineBreakIsComplexContext;
        }
    },

    lineBreakIsInfixNumeric: {
        configurable: true,
        get: function UnicodeChar_lazy_lineBreakIsInfixNumeric(){
            Object.defineProperty(this, 'lineBreakIsInfixNumeric', {value: UnicodeProperties.isLineBreak(this.code, 'Infix_Numeric')});
            if (this.lineBreakIsInfixNumeric){
                Object.defineProperty(this, 'lineBreakIsNumeric', {value: false});
                Object.defineProperty(this, 'lineBreakIsQuotation', {value: false});
                Object.defineProperty(this, 'lineBreakIsComplexContext', {value: false});
            }
            return this.lineBreakIsInfixNumeric;
        }
    },

    lineBreakIsNumeric: {
        configurable: true,
        get: function UnicodeChar_lazy_lineBreakIsNumeric(){
            Object.defineProperty(this, 'lineBreakIsNumeric', {value: UnicodeProperties.isLineBreak(this.code, 'Numeric')});
            if (this.lineBreakIsNumeric){
                Object.defineProperty(this, 'lineBreakIsInfixNumeric', {value: false});
                Object.defineProperty(this, 'lineBreakIsQuotation', {value: false});
                Object.defineProperty(this, 'lineBreakIsComplexContext', {value: false});
            }
            return this.lineBreakIsNumeric;
        }
    },

    lineBreakIsQuotation: {
        configurable: true,
        get: function UnicodeChar_lazy_lineBreakIsQuotation(){
            Object.defineProperty(this, 'lineBreakIsQuotation', {value: UnicodeProperties.isLineBreak(this.code, 'Quotation')});
            if (this.lineBreakIsQuotation){
                Object.defineProperty(this, 'lineBreakIsInfixNumeric', {value: false});
                Object.defineProperty(this, 'lineBreakIsNumeric', {value: false});
                Object.defineProperty(this, 'lineBreakIsComplexContext', {value: false});
            }
            return this.lineBreakIsQuotation;
        }
    },

    wordBreakIsKatakana: {
        configurable: true,
        get: function UnicodeChar_lazy_wordBreakIsKatakana(){
            Object.defineProperty(this, 'wordBreakIsKatakana', {value: UnicodeProperties.isWordBreak(this.code, 'Katakana')});
            if (this.wordBreakIsKatakana){
                Object.defineProperty(this, 'wordBreakIsExtend', {value: false});
                Object.defineProperty(this, 'wordBreakIsHebrewLetter', {value: false});
            }
            return this.wordBreakIsKatakana;
        }
    },

    wordBreakIsExtend: {
        configurable: true,
        get: function UnicodeChar_lazy_wordBreakIsExtend(){
            Object.defineProperty(this, 'wordBreakIsExtend', {value: UnicodeProperties.isWordBreak(this.code, 'Extend')});
            if (this.wordBreakIsExtend){
                Object.defineProperty(this, 'wordBreakIsKatakana', {value: false});
                Object.defineProperty(this, 'wordBreakIsHebrewLetter', {value: false});
            }
            return this.wordBreakIsExtend;
        }
    },

    wordBreakIsHebrewLetter: {
        configurable: true,
        get: function UnicodeChar_lazy_wordBreakIsHebrewLetter(){
            Object.defineProperty(this, 'wordBreakIsHebrewLetter', {value: UnicodeProperties.isWordBreak(this.code, 'Hebrew_Letter')});
            if (this.wordBreakIsHebrewLetter){
                Object.defineProperty(this, 'wordBreakIsExtend', {value: false});
                Object.defineProperty(this, 'wordBreakIsKatakana', {value: false});
            }
            return this.wordBreakIsHebrewLetter;
        }
    },

    alphabetic: {
        configurable: true,
        get: function UnicodeChar_lazy_alphabetic(){
            Object.defineProperty(this, 'alphabetic', {value: UnicodeProperties.isAlphabetic(this.code)});
            return this.alphabetic;
        }
    },

    ideographic: {
        configurable: true,
        get: function UnicodeChar_lazy_ideographic(){
            Object.defineProperty(this, 'ideographic', {value: UnicodeProperties.isIdeographic(this.code)});
            return this.ideographic;
        }
    },

    graphemeExtend: {
        configurable: true,
        get: function UnicodeChar_lazy_graphemeExtend(){
            Object.defineProperty(this, 'graphemeExtend', {value: UnicodeProperties.isGraphemeExtend(this.code)});
            return this.graphemeExtend;
        }
    },

    // Lazy properties used for word breaking, as defined in http://www.unicode.org/reports/tr29/

    wordBreakCR: {
        configurable: true,
        get: function UnicodeChar_lazy_wordBreakCR(){
            Object.defineProperty(this, 'wordBreakCR', {value: this.code == 0x0D});
            return this.wordBreakCR;
        }
    },

    wordBreakLF: {
        configurable: true,
        get: function UnicodeChar_lazy_wordBreakLF(){
            Object.defineProperty(this, 'wordBreakLF', {value: this.code == 0x0A});
            return this.wordBreakLF;
        }
    },

    wordBreakNewline: {
        configurable: true,
        get: function UnicodeChar_lazy_wordBreakNewline(){
            Object.defineProperty(this, 'wordBreakNewline', {value: this.code == 0x0B || this.code == 0x0C || this.code == 0x85 || this.code == 0x2028 || this.code == 0x2029});
            return this.wordBreakNewline;
        }
    },

    wordBreakAHLetter: {
        configurable: true,
        get: function UnicodeChar_lazy_wordBreakAHLetter(){
            // AHLetter: (ALetter | Hebrew_Letter)
            Object.defineProperty(this, 'wordBreakAHLetter', {value: this.wordBreakALetter || this.wordBreakHebrewLetter});
            return this.wordBreakAHLetter;
        }
    },

    wordBreakALetter: {
        configurable: true,
        get: function UnicodeChar_lazy_wordBreakALetter(){
            // ALetter: Alphabetic = Yes, or
            //          U+05F3 ( ׳ ) HEBREW PUNCTUATION GERESH
            //          and Ideographic = No
            //          and Word_Break ≠ Katakana
            //          and Line_Break ≠ Complex_Context (SA)
            //          and Script ≠ Hiragana
            //          and Word_Break ≠ Extend
            //          and Word_Break ≠ Hebrew_Letter
            var geresh = this.code == 0x05F3;
            Object.defineProperty(this, 'wordBreakALetter', {value: (this.alphabetic || geresh) && !this.ideographic && !this.wordBreakIsKatakana && !this.lineBreakIsComplexContext && !this.scriptIsHiragana && !this.wordBreakIsExtend && !this.wordBreakIsHebrewLetter});
            return this.wordBreakALetter;
        }
    },

    wordBreakHebrewLetter: {
        configurable: true,
        get: function UnicodeChar_lazy_wordBreakHebrewLetter(){
            // Hebrew_Letter: Script = Hebrew
            //                and General_Category = Other_Letter
            Object.defineProperty(this, 'wordBreakHebrewLetter', {value: this.scriptIsHebrew && this.generalCategoryIsOtherLetter});
            return this.wordBreakHebrewLetter;
        }
    },

    wordBreakKatakana: {
        configurable: true,
        get: function UnicodeChar_lazy_wordBreakKatakana(){
            // Katakana: Script = KATAKANA, or
            //           any of the following:
            //           U+3031 ( 〱 ) VERTICAL KANA REPEAT MARK
            //           U+3032 ( 〲 ) VERTICAL KANA REPEAT WITH VOICED SOUND MARK
            //           U+3033 ( 〳 ) VERTICAL KANA REPEAT MARK UPPER HALF
            //           U+3034 ( 〴 ) VERTICAL KANA REPEAT WITH VOICED SOUND MARK UPPER HALF
            //           U+3035 ( 〵 ) VERTICAL KANA REPEAT MARK LOWER HALF
            //           U+309B ( ゛ ) KATAKANA-HIRAGANA VOICED SOUND MARK
            //           U+309C ( ゜ ) KATAKANA-HIRAGANA SEMI-VOICED SOUND MARK
            //           U+30A0 ( ゠ ) KATAKANA-HIRAGANA DOUBLE HYPHEN
            //           U+30FC ( ー ) KATAKANA-HIRAGANA PROLONGED SOUND MARK
            //           U+FF70 ( ｰ ) HALFWIDTH KATAKANA-HIRAGANA PROLONGED SOUND MARK
            var extra = (this.code >= 0x3031 && this.code <= 0x3035) || this.code == 0x309B || this.code == 0x309C || this.code == 0x30A0 || this.code == 0x30FC || this.code == 0xFF70;
            Object.defineProperty(this, 'wordBreakKatakana', {value: this.scriptIsKatakana || extra});
            return this.wordBreakKatakana;
        }
    },

    wordBreakRegionalIndicator: {
        configurable: true,
        get: function UnicodeChar_lazy_wordBreakRegionalIndicator(){
            Object.defineProperty(this, 'wordBreakRegionalIndicator', {value: this.code >= 0x1F1E6 && this.code <= 0x1F1FF});
            return this.wordBreakRegionalIndicator;
        }
    },

    wordBreakSingleQuote: {
        configurable: true,
        get: function UnicodeChar_lazy_wordBreakSingleQuote(){
            Object.defineProperty(this, 'wordBreakSingleQuote', {value: this.code == 0x27});
            return this.wordBreakSingleQuote;
        }
    },

    wordBreakDoubleQuote: {
        configurable: true,
        get: function UnicodeChar_lazy_wordBreakDoubleQuote(){
            Object.defineProperty(this, 'wordBreakDoubleQuote', {value: this.code == 0x22});
            return this.wordBreakDoubleQuote;
        }
    },

    wordBreakNumeric: {
        configurable: true,
        get: function UnicodeChar_lazy_wordBreakNumeric(){
            // Numeric: Line_Break = Numeric
            //          and not U+066C ( ٬ ) ARABIC THOUSANDS SEPARATOR
            Object.defineProperty(this, 'wordBreakNumeric', {value: this.lineBreakIsNumeric && this.code != 0x66C});
            return this.wordBreakNumeric;
        }
    },

    wordBreakExtendedNumLet: {
        configurable: true,
        get: function UnicodeChar_lazy_wordBreakExtendedNumLet(){
            // ExtendNumLet: General_Category = Connector_Punctuation
            Object.defineProperty(this, 'wordBreakExtendedNumLet', {value: this.generalCategoryIsConnectorPunctuation});
            return this.wordBreakExtendedNumLet;
        }
    },

    wordBreakMidLetter: {
        configurable: true,
        get: function UnicodeChar_lazy_wordBreakMidLetter(){
            // MidLetter: U+00B7 ( · ) MIDDLE DOT
            //            U+0387 ( · ) GREEK ANO TELEIA
            //            U+05F4 ( ״ ) HEBREW PUNCTUATION GERSHAYIM
            //            U+2027 ( ‧ ) HYPHENATION POINT
            //            U+003A ( : ) COLON (used in Swedish)
            //            U+FE13 ( ︓ ) PRESENTATION FORM FOR VERTICAL COLON
            //            U+FE55 ( ﹕ ) SMALL COLON
            //            U+FF1A ( ： ) FULLWIDTH COLON
            //            U+02D7 ( ˗ ) MODIFIER LETTER MINUS SIGN
            Object.defineProperty(this, 'wordBreakMidLetter', {value: this.code == 0x00B7 || this.code == 0x0387 || this.code == 0x05F4 || this.code == 0x2027 || this.code == 0x003A || this.code == 0xFE13 || this.code == 0xFE55 || this.code == 0xFF1A || this.code == 0x02D7});
            return this.wordBreakMidLetter;
        }
    },

    wordBreakMidNumLet: {
        configurable: true,
        get: function UnicodeChar_lazy_wordBreakMidNumLet(){
            // MidNumLet: U+002E ( . ) FULL STOP
            //            U+2018 ( ‘ ) LEFT SINGLE QUOTATION MARK
            //            U+2019 ( ’ ) RIGHT SINGLE QUOTATION MARK
            //            U+2024 ( ․ ) ONE DOT LEADER
            //            U+FE52 ( ﹒ ) SMALL FULL STOP
            //            U+FF07 ( ＇ ) FULLWIDTH APOSTROPHE
            //            U+FF0E ( ． ) FULLWIDTH FULL STOP
            Object.defineProperty(this, 'wordBreakMidNumLet', {value: this.code == 0x002E || this.code == 0x2018 || this.code == 0x2019 || this.code == 0x2024 || this.code == 0xFE52 || this.code == 0xFF07 || this.code == 0xFF0E});
            return this.wordBreakMidNumLet;
        }
    },

    wordBreakMidNumLetQ: {
        configurable: true,
        get: function UnicodeChar_lazy_wordBreakMidNumLetQ(){
            // MidNumLetQ: (MidNumLet | Single_Quote)
            Object.defineProperty(this, 'wordBreakMidNumLetQ', {value: this.wordBreakMidNumLet || this.wordBreakSingleQuote});
            return this.wordBreakMidNumLetQ;
        }
    },

    wordBreakMidNum: {
        configurable: true,
        get: function UnicodeChar_lazy_wordBreakMidNum(){
            // MidNum: Line_Break = Infix_Numeric, or
            //         any of the following:
            //         U+066C ( ٬ ) ARABIC THOUSANDS SEPARATOR
            //         U+FE50 ( ﹐ ) SMALL COMMA
            //         U+FE54 ( ﹔ ) SMALL SEMICOLON
            //         U+FF0C ( ， ) FULLWIDTH COMMA
            //         U+FF1B ( ； ) FULLWIDTH SEMICOLON
            //         and not U+003A ( : ) COLON
            //         and not U+FE13 ( ︓ ) PRESENTATION FORM FOR VERTICAL COLON
            //         and not U+002E ( . ) FULL STOP
            var exclude = this.code == 0x003A || this.code == 0xFE13 || this.code == 0x002E;
            var include = this.code == 0x066C || this.code == 0xFE50 || this.code == 0xFE54 || this.code == 0xFF0C || this.code == 0xFF1B;
            Object.defineProperty(this, 'wordBreakMidNum', {value: (this.lineBreakIsInfixNumeric || include) && !exclude});
            return this.wordBreakMidNum;
        }
    },

    wordBreakExtend: {
        configurable: true,
        get: function UnicodeChar_lazy_wordBreakExtend(){
            // Extend: Grapheme_Extend = Yes,
            //         or General_Category = Spacing_Mark
            Object.defineProperty(this, 'wordBreakExtend', {value: this.graphemeExtend || this.generalCategoryIsSpacingMark});
            return this.wordBreakExtend;
        }
    },

    wordBreakFormat: {
        configurable: true,
        get: function UnicodeChar_lazy_wordBreakFormat(){
            // Format: General_Category = Format
            //         and not U+200B ZERO WIDTH SPACE (ZWSP)
            //         and not U+200C ZERO WIDTH NON-JOINER (ZWNJ)
            //         and not U+200D ZERO WIDTH JOINER (ZWJ)
            Object.defineProperty(this, 'wordBreakFormat', {value: this.generalCategoryIsFormat || !(this.code == 0x200B || this.code == 0x200C || this.code == 0x200D)});
            return this.wordBreakFormat;
        }
    }

});
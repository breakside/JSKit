// #import "UnicodeProperties.js"
/* global JSGlobalObject, UnicodeProperties, UnicodeChar */
'use strict';

JSGlobalObject.UnicodeChar = function(code){
    if (this === undefined){
        if (!(code in UnicodeChar.database)){
            UnicodeChar.constructing[code] = true;
            UnicodeChar.database[code] = new UnicodeChar(code);
        }
        return UnicodeChar.database[code];
    }else{
        if (!(code in UnicodeChar.constructing)){
            throw new Error("new UnicodeChar() is private.  Use UnicodeChar() instead.");
        }
        delete UnicodeChar.constructing[code];
    }
    this.code = code;
};

UnicodeChar.database = {};
UnicodeChar.constructing = {};

UnicodeChar.GeneralCategoryPropertyMap = {
    'Other_Letter':                 'generalCategoryIsOtherLetter',
    'Connector_Punctuation':        'generalCategoryIsConnectorPunctuation',
    'Spacing_Mark':                 'generalCategoryIsSpacingMark',
    'Format':                       'generalCategoryIsFormat',
    'Line_Separator':               'generalCategoryIsLineSeparator',
    'Paragraph_Separator':          'generalCategoryIsParagraphSeparator',
    'Control':                      'generalCategoryIsControl',
    'Unassigned':                   'generalCategoryIsUnassigned',
    'Surrogate':                    'generalCategoryIsSurrogate'
};

UnicodeChar.LineBreaks = {
    newLine:            0x000A,
    formFeed:           0x000C,
    carriageReturn:     0x000D,
    nextLine:           0x0085,
    lineSeparator:      0x2028,
    paragraphSeparator: 0x2029
};

UnicodeChar.prototype = Object.create(Object.prototype, {

    utf16: {
        get: function UnicodeChar_utf16(){
            return String.fromCodePoint(this.code);
        }
    },

    _lazyInitGeneralCategoryProperty: {
        value: function(category){
            var propertyName = UnicodeChar.GeneralCategoryPropertyMap[category];
            Object.defineProperty(this, propertyName, {value: UnicodeProperties.isGeneralCategory(this.code, category)});
            if (this[propertyName]){
                for (var _category in UnicodeChar.GeneralCategoryPropertyMap){
                    if (_category != category){
                        Object.defineProperty(this, UnicodeChar.GeneralCategoryPropertyMap[_category], {value: false});
                    }
                }
            }
            return this[propertyName];
        }
    },

    generalCategoryIsOtherLetter: {
        configurable: true,
        get: function UnicodeChar_lazy_generalCategoryIsOtherLetter(){
            return this._lazyInitGeneralCategoryProperty('Other_Letter');
        }
    },

    generalCategoryIsConnectorPunctuation: {
        configurable: true,
        get: function UnicodeChar_lazy_generalCategoryIsConnectorPunctuation(){
            return this._lazyInitGeneralCategoryProperty('Connector_Punctuation');
        }
    },

    generalCategoryIsSpacingMark: {
        configurable: true,
        get: function UnicodeChar_lazy_generalCategoryIsSpacingMark(){
            return this._lazyInitGeneralCategoryProperty('Spacing_Mark');
        }
    },

    generalCategoryIsFormat: {
        configurable: true,
        get: function UnicodeChar_lazy_generalCategoryIsFormat(){
            return this._lazyInitGeneralCategoryProperty('Format');
        }
    },

    generalCategoryIsLineSeparator: {
        configurable: true,
        get: function UnicodeChar_lazy_generalCategoryIsLineSeparator(){
            return this._lazyInitGeneralCategoryProperty('Line_Separator');
        }
    },

    generalCategoryIsParagraphSeparator: {
        configurable: true,
        get: function UnicodeChar_lazy_generalCategoryIsParagraphSeparator(){
            return this._lazyInitGeneralCategoryProperty('Paragraph_Separator');
        }
    },

    generalCategoryIsControl: {
        configurable: true,
        get: function UnicodeChar_lazy_generalCategoryIsControl(){
            return this._lazyInitGeneralCategoryProperty('Control');
        }
    },

    generalCategoryIsUnassigned: {
        configurable: true,
        get: function UnicodeChar_lazy_generalCategoryIsUnassigned(){
            return this._lazyInitGeneralCategoryProperty('Unassigned');
        }
    },

    generalCategoryIsSurrogate: {
        configurable: true,
        get: function UnicodeChar_lazy_generalCategoryIsSurrogate(){
            return this._lazyInitGeneralCategoryProperty('Surrogate');
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

    defaultIgnorableCodePoint: {
        configurable: true,
        get: function UnicodeChar_lazy_defaultIgnorableCodePoint(){
            Object.defineProperty(this, 'defaultIgnorableCodePoint', {value: UnicodeProperties.isDefaultIgnorableCodePoint(this.code)});
            return this.defaultIgnorableCodePoint;
        }
    },

    hangulSyllableTypeIsL: {
        configurable: true,
        get: function UnicodeChar_lazy_hangulSyllableTypeIsL(){
            Object.defineProperty(this, 'hangulSyllableTypeIsL', {value: UnicodeProperties.isHangulSyllableType(this.code, 'L')});
            if (this.hangulSyllableTypeIsL){
                Object.defineProperty(this, 'hangulSyllableTypeIsV', {value: false});
                Object.defineProperty(this, 'hangulSyllableTypeIsT', {value: false});
                Object.defineProperty(this, 'hangulSyllableTypeIsLV', {value: false});
                Object.defineProperty(this, 'hangulSyllableTypeIsLVT', {value: false});
            }
            return this.hangulSyllableTypeIsL;
        }
    },

    hangulSyllableTypeIsV: {
        configurable: true,
        get: function UnicodeChar_lazy_hangulSyllableTypeIsV(){
            Object.defineProperty(this, 'hangulSyllableTypeIsV', {value: UnicodeProperties.isHangulSyllableType(this.code, 'V')});
            if (this.hangulSyllableTypeIsV){
                Object.defineProperty(this, 'hangulSyllableTypeIsL', {value: false});
                Object.defineProperty(this, 'hangulSyllableTypeIsT', {value: false});
                Object.defineProperty(this, 'hangulSyllableTypeIsLV', {value: false});
                Object.defineProperty(this, 'hangulSyllableTypeIsLVT', {value: false});
            }
            return this.hangulSyllableTypeIsV;
        }
    },

    hangulSyllableTypeIsT: {
        configurable: true,
        get: function UnicodeChar_lazy_hangulSyllableTypeIsT(){
            Object.defineProperty(this, 'hangulSyllableTypeIsT', {value: UnicodeProperties.isHangulSyllableType(this.code, 'T')});
            if (this.hangulSyllableTypeIsT){
                Object.defineProperty(this, 'hangulSyllableTypeIsL', {value: false});
                Object.defineProperty(this, 'hangulSyllableTypeIsV', {value: false});
                Object.defineProperty(this, 'hangulSyllableTypeIsLV', {value: false});
                Object.defineProperty(this, 'hangulSyllableTypeIsLVT', {value: false});
            }
            return this.hangulSyllableTypeIsT;
        }
    },

    hangulSyllableTypeIsLV: {
        configurable: true,
        get: function UnicodeChar_lazy_hangulSyllableTypeIsLV(){
            Object.defineProperty(this, 'hangulSyllableTypeIsLV', {value: UnicodeProperties.isHangulSyllableType(this.code, 'LV')});
            if (this.hangulSyllableTypeIsLV){
                Object.defineProperty(this, 'hangulSyllableTypeIsL', {value: false});
                Object.defineProperty(this, 'hangulSyllableTypeIsV', {value: false});
                Object.defineProperty(this, 'hangulSyllableTypeIsT', {value: false});
                Object.defineProperty(this, 'hangulSyllableTypeIsLVT', {value: false});
            }
            return this.hangulSyllableTypeIsLV;
        }
    },

    hangulSyllableTypeIsLVT: {
        configurable: true,
        get: function UnicodeChar_lazy_hangulSyllableTypeIsLVT(){
            Object.defineProperty(this, 'hangulSyllableTypeIsLVT', {value: UnicodeProperties.isHangulSyllableType(this.code, 'LVT')});
            if (this.hangulSyllableTypeIsLVT){
                Object.defineProperty(this, 'hangulSyllableTypeIsL', {value: false});
                Object.defineProperty(this, 'hangulSyllableTypeIsV', {value: false});
                Object.defineProperty(this, 'hangulSyllableTypeIsT', {value: false});
                Object.defineProperty(this, 'hangulSyllableTypeIsLV', {value: false});
            }
            return this.hangulSyllableTypeIsLVT;
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
            Object.defineProperty(this, 'wordBreakFormat', {value: this.generalCategoryIsFormat && this.code != 0x200B && this.code != 0x200C && this.code != 0x200D});
            return this.wordBreakFormat;
        }
    },

    // lazy properties for grapheme cluster break

    graphemeClusterBreakCR: {
        configurable: true,
        get: function UnicodeChar_lazy_graphemeClusterBreakCR(){
            Object.defineProperty(this, 'graphemeClusterBreakCR', {value: this.wordBreakCR});
            return this.graphemeClusterBreakCR;
        }
    },

    graphemeClusterBreakLF: {
        configurable: true,
        get: function UnicodeChar_lazy_graphemeClusterBreakLF(){
            Object.defineProperty(this, 'graphemeClusterBreakLF', {value: this.wordBreakLF});
            return this.graphemeClusterBreakLF;
        }
    },

    graphemeClusterBreakControl: {
        configurable: true,
        get: function UnicodeChar_lazy_graphemeClusterBreakControl(){
            // General_Category = Line_Separator, or
            // General_Category = Paragraph_Separator, or
            // General_Category = Control, or
            // General_Category = Unassigned and Default_Ignorable_Code_Point, or
            // General_Category = Surrogate, or
            // General_Category = Format
            // and not U+000D CARRIAGE RETURN
            // and not U+000A LINE FEED
            // and not U+200C ZERO WIDTH NON-JOINER (ZWNJ)
            // and not U+200D ZERO WIDTH JOINER (ZWJ)
            var category = this.generalCategoryIsLineSeparator || this.generalCategoryIsParagraphSeparator || this.generalCategoryIsControl || (this.generalCategoryIsUnassigned && this.defaultIgnorableCodePoint) || this.generalCategoryIsSurrogate || this.generalCategoryIsFormat;
            var excepted = this.code == 0x000D || this.code == 0x000A || this.code == 0x200C || this.code == 0x200D;
            Object.defineProperty(this, 'graphemeClusterBreakControl', {value: category && !excepted});
            return this.graphemeClusterBreakControl;
        }
    },

    graphemeClusterBreakExtend: {
        configurable: true,
        get: function UnicodeChar_lazy_graphemeClusterBreakExtend(){
            // Grapheme_Extend = Yes

            // This includes:
            // General_Category = Nonspacing_Mark
            // General_Category = Enclosing_Mark
            // U+200C ZERO WIDTH NON-JOINER
            // U+200D ZERO WIDTH JOINER
            // plus a few General_Category = Spacing_Mark needed for canonical equivalence.
            Object.defineProperty(this, 'graphemeClusterBreakExtend', {value: this.graphemeExtend});
            return this.graphemeClusterBreakExtend;
        }
    },

    graphemeClusterBreakRegionalIndicator: {
        configurable: true,
        get: function UnicodeChar_lazy_graphemeClusterBreakRegionalIndicator(){
            Object.defineProperty(this, 'graphemeClusterBreakRegionalIndicator', {value: this.wordBreakRegionalIndicator});
            return this.graphemeClusterBreakRegionalIndicator;
        }
    },

    graphemeClusterBreakPrepend: {
        configurable: true,
        get: function UnicodeChar_lazy_graphemeClusterBreakPrepend(){
            // Currently there are no characters with this value.
            Object.defineProperty(this, 'graphemeClusterBreakPrepend', {value: false});
            return this.graphemeClusterBreakPrepend;
        }
    },

    graphemeClusterBreakSpacingMark: {
        configurable: true,
        get: function UnicodeChar_lazy_graphemeClusterBreakSpacingMark(){
            // Grapheme_Cluster_Break ≠ Extend, and
            // General_Category = Spacing_Mark, or
            // any of the following (which have General_Category = Other_Letter):
            // U+0E33 ( ำ ) THAI CHARACTER SARA AM
            // U+0EB3 ( ຳ ) LAO VOWEL SIGN AM

            // Exceptions: The following (which have General_Category = Spacing_Mark and would otherwise be included) are specifically excluded:
            // U+102B ( ါ ) MYANMAR VOWEL SIGN TALL AA
            // U+102C ( ာ ) MYANMAR VOWEL SIGN AA
            // U+1038 ( း ) MYANMAR SIGN VISARGA
            // U+1062 ( ၢ ) MYANMAR VOWEL SIGN SGAW KAREN EU
            // ..U+1064 ( ၤ ) MYANMAR TONE MARK SGAW KAREN KE PHO
            // U+1067 ( ၧ ) MYANMAR VOWEL SIGN WESTERN PWO KAREN EU
            // ..U+106D ( ၭ ) MYANMAR SIGN WESTERN PWO KAREN TONE-5
            // U+1083 ( ႃ ) MYANMAR VOWEL SIGN SHAN AA
            // U+1087 ( ႇ ) MYANMAR SIGN SHAN TONE-2
            // ..U+108C ( ႌ ) MYANMAR SIGN SHAN COUNCIL TONE-3
            // U+108F ( ႏ ) MYANMAR SIGN RUMAI PALAUNG TONE-5
            // U+109A ( ႚ ) MYANMAR SIGN KHAMTI TONE-1
            // ..U+109C ( ႜ ) MYANMAR VOWEL SIGN AITON A
            // U+1A61 ( ᩡ ) TAI THAM VOWEL SIGN A
            // U+1A63 ( ᩣ ) TAI THAM VOWEL SIGN AA
            // U+1A64 ( ᩤ ) TAI THAM VOWEL SIGN TALL AA
            // U+AA7B ( ꩻ ) MYANMAR SIGN PAO KAREN TONE
            // U+AA7D ( ꩽ ) MYANMAR SIGN TAI LAING TONE-5
            // U+11720 ( 𑜠 ) AHOM VOWEL SIGN A
            // U+11721 ( 𑜡 ) AHOM VOWEL SIGN AA
            var main = !this.graphemeExtend && this.generalCategoryIsSpacingMark;
            var additional = this.code == 0x0E33 && this.code == 0x0EB3;
            var excepted = 
                this.code == 0x102B ||
                this.code == 0x102C ||
                this.code == 0x1038 ||
                this.code == 0x1062 ||
                this.code == 0x1063 ||
                this.code == 1064 ||
                (this.code >= 0x1067 && this.code <= 0x106D) ||
                this.code == 0x1083 ||
                (this.code >= 0x1087 && this.code <= 0x108C) ||
                this.code == 0x108F ||
                this.code == 0x109A ||
                this.code == 0x109B ||
                this.code == 0x109C ||
                this.code == 0x1A61 ||
                this.code == 0x1A63 ||
                this.code == 0x1A64 ||
                this.code == 0xAA7B ||
                this.code == 0xAA7D ||
                this.code == 0x11720 ||
                this.code == 0x11721;
            Object.defineProperty(this, 'graphemeClusterBreakSpacingMark', {value: (main || additional) && !excepted});
            return this.graphemeClusterBreakSpacingMark;
        }
    },

    graphemeClusterBreakL: {
        configurable: true,
        get: function UnicodeChar_lazy_graphemeClusterBreakL(){
            // Hangul_Syllable_Type=L, such as:
            // U+1100 ( ᄀ ) HANGUL CHOSEONG KIYEOK
            // U+115F ( ᅟ ) HANGUL CHOSEONG FILLER
            // U+A960 ( ꥠ ) HANGUL CHOSEONG TIKEUT-MIEUM
            // U+A97C ( ꥼ ) HANGUL CHOSEONG SSANGYEORINHIEUH
            Object.defineProperty(this, 'graphemeClusterBreakL', {value: this.hangulSyllableTypeIsL});
            return this.graphemeClusterBreakL;
        }
    },

    graphemeClusterBreakV: {
        configurable: true,
        get: function UnicodeChar_lazy_graphemeClusterBreakV(){
            // Hangul_Syllable_Type=V, such as:
            // U+1160 ( ᅠ ) HANGUL JUNGSEONG FILLER
            // U+11A2 ( ᆢ ) HANGUL JUNGSEONG SSANGARAEA
            // U+D7B0 ( ힰ ) HANGUL JUNGSEONG O-YEO
            // U+D7C6 ( ퟆ ) HANGUL JUNGSEONG ARAEA-E
            Object.defineProperty(this, 'graphemeClusterBreakV', {value: this.hangulSyllableTypeIsV});
            return this.graphemeClusterBreakV;
        }
    },

    graphemeClusterBreakT: {
        configurable: true,
        get: function UnicodeChar_lazy_graphemeClusterBreakT(){
            // Hangul_Syllable_Type=T, such as:
            // U+11A8 ( ᆨ ) HANGUL JONGSEONG KIYEOK
            // U+11F9 ( ᇹ ) HANGUL JONGSEONG YEORINHIEUH
            // U+D7CB ( ퟋ ) HANGUL JONGSEONG NIEUN-RIEUL
            // U+D7FB ( ퟻ ) HANGUL JONGSEONG PHIEUPH-THIEUTH
            Object.defineProperty(this, 'graphemeClusterBreakT', {value: this.hangulSyllableTypeIsT});
            return this.graphemeClusterBreakT;
        }
    },

    graphemeClusterBreakLV: {
        configurable: true,
        get: function UnicodeChar_lazy_graphemeClusterBreakLV(){
            // Hangul_Syllable_Type=LV, that is:
            // U+AC00 (가) HANGUL SYLLABLE GA
            // U+AC1C (개) HANGUL SYLLABLE GAE
            // U+AC38 (갸) HANGUL SYLLABLE GYA
            // ...
            Object.defineProperty(this, 'graphemeClusterBreakLV', {value: this.hangulSyllableTypeIsLV});
            return this.graphemeClusterBreakLV;
        }
    },

    graphemeClusterBreakLVT: {
        configurable: true,
        get: function UnicodeChar_lazy_graphemeClusterBreakLVT(){
            // Hangul_Syllable_Type=LVT, that is:
            // U+AC01 (각) HANGUL SYLLABLE GAG
            // U+AC02 (갂) HANGUL SYLLABLE GAGG
            // U+AC03 (갃) HANGUL SYLLABLE GAGS
            // U+AC04 (간) HANGUL SYLLABLE GAN
            // ...
            Object.defineProperty(this, 'graphemeClusterBreakLVT', {value: this.hangulSyllableTypeIsLVT});
            return this.graphemeClusterBreakLVT;
        }
    },

    isLineBreak: {
        configurable: true,
        get: function UnicodeChar_lazy_isLineBreak(){
            Object.defineProperty(this, 'isLineBreak', {value: this.code === UnicodeChar.LineBreaks.newLine || this.code === UnicodeChar.LineBreaks.formFeed || this.code === UnicodeChar.LineBreaks.carriageReturn || this.code === UnicodeChar.LineBreaks.nextLine || this.code === UnicodeChar.LineBreaks.lineSeparator || this.code === UnicodeChar.LineBreaks.paragraphSeparator});
            return this.isLineBreak;
        }
    }

});

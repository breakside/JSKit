// #import "JSFont.js"
// #import "JSURL.js"
// jshint browser: true
'use strict';

(function(){

JSFont.definePropertiesFromExtensions({

    cssString: function(lineHeight){
        if (lineHeight === undefined){
            lineHeight = this.displayLineHeight;
        }
        return this._descriptor.cssString(this._pointSize, lineHeight);
    }

});

var HTMLFontMetricsCalculator = function(domDocument){
    this.domDocument = document;
    this.containerElement = this.domDocument.createElement('div');
    this.containerElement.style.position = 'absolute';
    this.containerElement.style.bottom = '100%';
    this.containerElement.style.left = '0';
    this.containerElement.style.visibility = 'hidden';
    this.atSizeElement = this.domDocument.createElement('span');
    this.baselineElement = this.domDocument.createElement('span');
    this.baselineElement.style.display = 'inline-block';
    this.baselineElement.style.vertialAlign = 'baseline';
    this.baselineElement.style.width = '1px';
    this.baselineElement.style.height = '1px';
    this.atSizeElement.appendChild(this.domDocument.createTextNode('Ay'));
    this.containerElement.appendChild(this.atSizeElement);
    this.containerElement.appendChild(this.baselineElement);
    this.domDocument.body.appendChild(this.containerElement);
};

Object.defineProperties(HTMLFontMetricsCalculator, {

    shared: {
        enumerable: false,
        configurable: true,
        get: function HTMLFontMetricsCalculator_shared(){
            var shared = new HTMLFontMetricsCalculator(document);
            Object.defineProperty(HTMLFontMetricsCalculator, 'shared', {
                enumerable: false,
                configurable: false,
                value: shared
            });
            return shared;
        }
    }

});

HTMLFontMetricsCalculator.prototype = {
    domDocument: null,

    containerElement: null,
    atSizeElement: null,
    baselineElement: null,

    calculate: function(font){
        this.containerElement.style.font = font.cssString(font._pointSize * 4.0);
        var lineHeight = this.atSizeElement.offsetHeight;
        var ascender = this.baselineElement.offsetTop + this.baselineElement.offsetHeight - this.atSizeElement.offsetTop;
        var descender = ascender - lineHeight;
        font._displayDescender = descender;
        font._displayAscender = ascender;
        font._displayLineHeight = lineHeight;
    }

};

})();
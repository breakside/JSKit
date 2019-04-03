// #import Foundation
/* global JSColor */
'use strict';

JSColor.definePropertiesFromExtensions({

    pdfFillColorCommand: function(){
        switch (this.colorSpace){
            case JSColor.SpaceIdentifier.rgb:
            case JSColor.SpaceIdentifier.rgba:
                return "%f %f %f rg ".sprintf(this.red, this.green, this.blue);
            case JSColor.SpaceIdentifier.hsl:
            case JSColor.SpaceIdentifier.hsla:
                return JSColor.rgbaColor().pdfFillColorCommand();
            case JSColor.SpaceIdentifier.gray:
            case JSColor.SpaceIdentifier.graya:
                return "%f g ".sprintf(this.white);
        }
    },

    pdfStrokeColorCommand: function(){
        return this.pdfFillColorCommand().toUpperCase();
    }
});
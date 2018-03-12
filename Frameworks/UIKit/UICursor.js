// #import "Foundation/Foundation.js"
/* global JSClass, JSObject, JSPoint, UICursor */
'use strict';

JSClass("UICursor", JSObject, {

    image: null,
    hotSpot: JSPoint.Zero,
    systemIdentifier: null,

    initWithSystemIdentifier: function(systemIdentifier){
        this.systemIdentifier = systemIdentifier;
    },

    initWithImage: function(image, hotSpot){
        this.image = image;
        this.hotSpot = hotSpot;
    },

    cssString: function(){
        if (this.systemIdentifier !== null){
            return this.systemIdentifier;
        }
        return 'url("%s") %d %d, default'.sprintf(this.image.htmlURLString(), this.hotSpot.x, this.hotSpot.y);
    }

});

UICursor.SystemIdentifier = {
    arrow: 'default',
    iBeam: 'text',
    pointingHand: 'pointer',
    operationNotAllowed: 'not-allowed',
    resizeLeftRight: 'col-resize',
    resizeUpDown: 'row-resize',
    openHand: 'grab',
    closedHand: 'grabbing',
    dragLink: 'alias',
    dragCopy: 'copy'
};

UICursor.arrow = UICursor.initWithSystemIdentifier(UICursor.SystemIdentifier.arrow);
UICursor.iBeam = UICursor.initWithSystemIdentifier(UICursor.SystemIdentifier.iBeam);
UICursor.pointingHand = UICursor.initWithSystemIdentifier(UICursor.SystemIdentifier.pointingHand);
UICursor.operationNotAllowed = UICursor.initWithSystemIdentifier(UICursor.SystemIdentifier.operationNotAllowed);
UICursor.resizeLeftRight = UICursor.initWithSystemIdentifier(UICursor.SystemIdentifier.resizeLeftRight);
UICursor.resizeUpDown = UICursor.initWithSystemIdentifier(UICursor.SystemIdentifier.resizeUpDown);
UICursor.openHand = UICursor.initWithSystemIdentifier(UICursor.SystemIdentifier.openHand);
UICursor.closedHand = UICursor.initWithSystemIdentifier(UICursor.SystemIdentifier.closedHand);
UICursor.dragLink = UICursor.initWithSystemIdentifier(UICursor.SystemIdentifier.dragLink);
UICursor.dragCopy = UICursor.initWithSystemIdentifier(UICursor.SystemIdentifier.dragCopy);
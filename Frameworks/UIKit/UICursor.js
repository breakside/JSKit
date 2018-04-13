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
    },

    push: function(){
        UICursor.push(this);
    },

    pop: function(){
        UICursor.pop();
    }
});

UICursor.hide = function(){
    if (UICursor._hideCount === 0){
        UICursor._windowServer.hideCursor();
    }
    ++UICursor._hideCount;
};

UICursor.unhide = function(){
    if (UICursor._hideCount === 0){
        return;
    }
    --UICursor._hideCount;
    if (UICursor._hideCount === 0){
        UICursor._windowServer.unhideCursor();
    }
};

UICursor.push = function(cursor){
    UICursor._stack.push(cursor);
    UICursor.show();
};

UICursor.pop = function(){
    if (UICursor._stack.length > 1){
        UICursor._stack.pop();
        UICursor.show();
    }
};

UICursor.show = function(){
    if (this._hideCount === 0){
        UICursor._windowServer.setCursor(UICursor.currentCursor);
    }
};

Object.defineProperties(UICursor, {
    currentCursor: {
        get: function UICursor_getCurrentCursor(){
            return UICursor._stack[UICursor._stack.length - 1];
        }
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

UICursor._hideCount = 0;
UICursor._stack = [UICursor.arrow];
UICursor._windowServer = null;
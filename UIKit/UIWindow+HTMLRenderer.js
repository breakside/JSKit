// #import "UIKit/UIView+HTMLRenderer.js"

UIWindow.HTMLRenderer = UIView.HTMLRenderer.$extend({

    domWindow: null,

    init: function(){
        UIWindow.HTMLRenderer.$super.initWithElementName.call(this, 'div');
        document.body.appendChild(this.element);
        this.domWindow = window;
    },

    viewCanStartReceivingEvents: function(window){
        UIWindow.$super.viewCanStartReceivingEvents.call(this, window);
        this.domWindow.addEventListener('resize', this);
    },

    handleEvent: function(domEvent){
        if (domEvent.type == 'resize'){
            // TODO: 
        }
    }

}, 'UIWindow.HTMLRenderer');

UIWindow.registerRenderer(UIWindow.HTMLRenderer);
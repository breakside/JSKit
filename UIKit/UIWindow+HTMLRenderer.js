// #import "UIKit/UIView+HTMLRenderer.js"

UIWindow.HTMLRenderer = UIView.HTMLRenderer.$extend({

    window: null,
    domWindow: null,

    initWithView: function(view){
        UIWindow.HTMLRenderer.$super.initWithElementName.call(this, view, 'div');
        this.window = this.view;
        document.body.appendChild(this.element);
        this.domWindow = window;
        this.window.frame = JSRect(0, 0, this.domWindow.innerWidth, this.domWindow.innerHeight);
    },

    setupElement: function(){
        UIWindow.HTMLRenderer.$super.setupElement.call(this);
        this.element.style.position = 'absolute';
    },

    viewCanStartReceivingEvents: function(window){
        UIWindow.HTMLRenderer.$super.viewCanStartReceivingEvents.call(this, window);
        this.domWindow.addEventListener('resize', this);
    },

    handleEvent: function(domEvent){
        UIWindow.$super.handleEvent(domEvent);
        if (domEvent.type == 'resize'){
            this.window.frame = JSRect(0, 0, this.domWindow.innerWidth, this.domWindow.innerHeight);
        }
    }

}, 'UIWindow.HTMLRenderer');

UIWindow.registerRenderer(UIWindow.HTMLRenderer);
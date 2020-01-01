// #import Foundation
// #import "UIApplication.js"
/* global JSClass, JSObject, JSReadOnlyProperty, UIScene, UIApplication, JSSpec */
'use strict';

JSClass("UIScene", JSObject, {

    menuBar: null,
    windowStack: JSReadOnlyProperty('_windowStack'),
    application: null,

    init: function(){
        this._commonInit();
    },

    initWithSpec: function(spec, values){
        UIScene.$super.initWithSpec.call(this, spec, values);
        this._commonInit();
        if ('menuBar' in values){
            this.menuBar = spec.resolvedValue(values.menuBar, "UIMenuBar");
        }
        if ('windowStack' in values){
            var window;
            for (var i = 0, l = values.windowStack.length; i < l; ++i){
                window = spec.resolvedValue(values.windowStack[i], "UIWindow");
                this.addWindow(window);
            }
        }
    },

    addWindow: function(window){
        window._scene = this;
        this._windowStack.push(window);
    },

    _commonInit: function(){
        this.application = UIApplication.shared;
        this._windowStack = [];
    },

    show: function(){
        if (this.menuBar){
            this.application.windowServer.menuBar = this.menuBar;
        }
        var window = null;
        for (var i = 0, l = this._windowStack.length; i < l; ++i){
            window = this._windowStack[i];
            window.orderFront();
        }
        if (window !== null){
            window.makeKey();
        }
        UIScene._visible = this;
    },

    close: function(){
        var windowServer = this.application.windowServer;
        if (this.menuBar){
            windowServer.menuBar = null;
        }
        var window;
        for (var i = windowServer.windowStack.length - 1; i >= 0; --i){
            window = windowServer.windowStack[i];
            window.close();
        }
    },

});

UIScene._visible = null;

Object.defineProperty(UIScene, 'visible', {
    get: function UIScene_getVisible(){
        return UIScene._visible;
    }
});
// #import "Foundation/Foundation.js"
// #import "UIKit/UIApplication.js"
/* global JSClass, JSObject, UIScene, UIApplication, JSSpec */
'use strict';

JSClass("UIScene", JSObject, {

    menuBar: null,
    windowStack: null,
    application: null,

    init: function(){
        this._commonInit();
    },

    initWithSpecName: function(specName){
        var spec = JSSpec.initWithResource(specName);
        var owner = spec.filesOwner;
        if (owner.isKindOfClass(UIScene)){
            return owner;
        }
        return null;
    },

    initWithSpec: function(spec, values){
        UIScene.$super.initWithSpec.call(this, spec, values);
        this._commonInit();
        if ('menuBar' in spec.values){
            this.menuBar = spec.resolvedValue(values.menuBar, "UIMenuBar");
        }
        if ('windowStack' in spec.values){
            for (var i = 0, l = spec.values.windowStack.length; i < l; ++i){
                this.windowStack.push(spec.resolvedValue(spec.values.windowStack[i], "UIWindow"));
            }
        }
    },

    _commonInit: function(){
        this.application = UIApplication.sharedApplication;
        this.windowStack = [];
    },

    makeVisible: function(){
        if (this.menuBar){
            this.application.windowServer.menuBar = this.menuBar;
        }
        var window = null;
        for (var i = 0, l = this.windowStack.length; i < l; ++i){
            window = this.windowStack[i];
            window.makeVisible();
        }
        if (window !== null){
            window.makeKey();
        }
    },

    close: function(){
        var window;
        for (var i = 0, l = this.windowStack.length; i < l; ++i){
            window = this.windowStack[i];
            window.close();
        }
        if (this.menuBar){
            this.application.windowServer.menuBar = null;
        }
    }

});
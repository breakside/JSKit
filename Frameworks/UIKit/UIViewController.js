// #import "Foundation/Foundation.js"
/* global JSClass, JSObject */

JSClass("UIViewController", JSObject, {
    view: null,
    isViewLoaded: false,

    init: function(){
    }

    loadView: function(){
        this.view = UIView.initWithFrame();
        this.isViewLoaded = true;
        viewDidLoad();
    },

    viewDidLoad: function(){
    }

});
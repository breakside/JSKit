// #import UIKit
// #import TestKit
'use strict';

JSClass("UIHTMLDisplayServerTests", TKTestSuite, {

    requiredEnvironment: 'html',

    setup: function(){
        // defining the class withing the setup method because the superclass is only availble
        // in the html environment.  If we tried to define the class at the top level of code like
        // normal, it would cause an error in non-HTML environments because they don't have the superclass
        if (!JSGlobalObject.UIHTMLDisplayServerTestsDisplayServer){
            JSClass("UIHTMLDisplayServerTestsDisplayServer", UIHTMLDisplayServer, {
                setUpdateNeeded: function(){
                }
            });
        }
        this.rootElement = document.createElement('div');
        this.rootElement.style.position = 'absolute';
        this.rootElement.style.width = '1000px';
        this.rootElement.style.height = '1000px';
        document.body.appendChild(this.rootElement);
        this.displayServer = UIHTMLDisplayServerTestsDisplayServer.initWithRootElement(this.rootElement);
    },

    teardown: function(){
        this.displayServer.deinit();
        this.displayServer = null;
        this.rootElement.parentNode.removeChild(this.rootElement);
    },

    _resetDisplayServer: function(){
        this.displayServer.deinit();
        this.rootElement.innerHTML = '';
        this.displayServer = null;
        this.displayServer = UIHTMLDisplayServerTestsDisplayServer.initWithRootElement(this.rootElement);
    },

    testLayerInserted: function(){
        // Basic insert
        var layer = UILayer.init();
        layer.frame = JSRect(10, 20, 30, 40);
        this.displayServer.windowInserted({layer: layer, didClose: function(){ }, didBecomeVisible: function(){ }});
        TKAssertEquals(this.displayServer.screenContext.element.childNodes.length, 0);
        this.displayServer.updateDisplay(0);
        TKAssertEquals(this.displayServer.screenContext.element.childNodes.length, 1);
        var element = this.displayServer.screenContext.element.childNodes[0];
        TKAssertEquals(element.style.position, 'absolute');
        TKAssertEquals(element.style.left, '10px');
        TKAssertEquals(element.style.top, '20px');
        TKAssertEquals(element.style.width, '30px');
        TKAssertEquals(element.style.height, '40px');

        // sublayer added before insert
        this._resetDisplayServer();
        var layer1 = UILayer.init();
        var layer2 = UILayer.init();
        layer1.frame = JSRect(10, 20, 300, 400);
        layer2.frame = JSRect(5, 6, 7, 8);
        layer1.addSublayer(layer2);
        this.displayServer.windowInserted({layer: layer1, didClose: function(){ }, didBecomeVisible: function(){ }});
        TKAssertEquals(this.displayServer.screenContext.element.childNodes.length, 0);
        this.displayServer.updateDisplay(0);
        TKAssertEquals(this.displayServer.screenContext.element.childNodes.length, 1);
        element = this.displayServer.screenContext.element.childNodes[0];
        TKAssertEquals(element.style.position, 'absolute');
        TKAssertEquals(element.style.left, '10px');
        TKAssertEquals(element.style.top, '20px');
        TKAssertEquals(element.style.width, '300px');
        TKAssertEquals(element.style.height, '400px');
        TKAssertEquals(element.childNodes.length, 1);
        element = element.childNodes[0];
        TKAssertEquals(element.style.position, 'absolute');
        TKAssertEquals(element.style.left, '5px');
        TKAssertEquals(element.style.top, '6px');
        TKAssertEquals(element.style.width, '7px');
        TKAssertEquals(element.style.height, '8px');

        // sublayer added after insert
        this._resetDisplayServer();
        layer1 = UILayer.init();
        layer2 = UILayer.init();
        layer1.frame = JSRect(10, 20, 300, 400);
        layer2.frame = JSRect(5, 6, 7, 8);
        this.displayServer.windowInserted({layer: layer1, didClose: function(){ }, didBecomeVisible: function(){ }});
        TKAssertEquals(this.displayServer.screenContext.element.childNodes.length, 0);
        this.displayServer.updateDisplay(0);
        TKAssertEquals(this.displayServer.screenContext.element.childNodes.length, 1);
        element = this.displayServer.screenContext.element.childNodes[0];
        TKAssertEquals(element.style.position, 'absolute');
        TKAssertEquals(element.style.left, '10px');
        TKAssertEquals(element.style.top, '20px');
        TKAssertEquals(element.style.width, '300px');
        TKAssertEquals(element.style.height, '400px');
        TKAssertEquals(element.childNodes.length, 0);
        layer1.addSublayer(layer2);
        TKAssertEquals(element.childNodes.length, 0);
        this.displayServer.updateDisplay(0.001);
        TKAssertEquals(element.childNodes.length, 1);
        element = element.childNodes[0];
        TKAssertEquals(element.style.position, 'absolute');
        TKAssertEquals(element.style.left, '5px');
        TKAssertEquals(element.style.top, '6px');
        TKAssertEquals(element.style.width, '7px');
        TKAssertEquals(element.style.height, '8px');
    },

    testLayerRemoved: function(){
        // Basic remove
        var layer = UILayer.init();
        var mockWindow = {layer: layer, didClose: function(){ }, didBecomeVisible: function(){ }};
        layer.frame = JSRect(10, 20, 30, 40);
        this.displayServer.windowInserted(mockWindow);
        TKAssertEquals(this.displayServer.screenContext.element.childNodes.length, 0);
        this.displayServer.updateDisplay(0);
        TKAssertEquals(this.displayServer.screenContext.element.childNodes.length, 1);
        this.displayServer.windowRemoved(mockWindow);
        TKAssertEquals(this.displayServer.screenContext.element.childNodes.length, 1);
        this.displayServer.updateDisplay(0.001);
        TKAssertEquals(this.displayServer.screenContext.element.childNodes.length, 0);

        // multilayer remove
        this._resetDisplayServer();
        var layer1 = UILayer.init();
        var layer2 = UILayer.init();
        mockWindow = {layer: layer1, didClose: function(){ }, didBecomeVisible: function(){ }};
        layer1.frame = JSRect(10, 20, 300, 400);
        layer2.frame = JSRect(5, 6, 7, 8);
        layer1.addSublayer(layer2);
        this.displayServer.windowInserted(mockWindow);
        TKAssertEquals(this.displayServer.screenContext.element.childNodes.length, 0);
        this.displayServer.updateDisplay(0);
        TKAssertEquals(this.displayServer.screenContext.element.childNodes.length, 1);
        var element = this.displayServer.screenContext.element.childNodes[0];
        TKAssertEquals(element.childNodes.length, 1);
        this.displayServer.windowRemoved(mockWindow);
        TKAssertEquals(this.displayServer.screenContext.element.childNodes.length, 1);
        TKAssertEquals(element.childNodes.length, 1);
        this.displayServer.updateDisplay(0.001);
        TKAssertEquals(this.displayServer.screenContext.element.childNodes.length, 0);
        TKAssertEquals(element.childNodes.length, 1);
    }

});
// #import "Foundation/Foundation.js"
// #global JSObject, JSClass

JSClass("TKTestSuite", JSObject, {

    testCases: null,

    init: function(){
        this.testCases = [];
        this._findTestCases();
    },

    _findTestCases: function(){
        this.testCases = [];
        for (var x in this){
            if (x.length > 4 && x.substr(0,4) == 'test' && x[5] >= 'A' && x[5] <= 'Z'){
                this.testCases.push(x);
            }
        }
    },

    run: function(){
        var methodName;
        var test;
        for (var i = 0, l = this.testCases.length; i < l; ++i){
            methodName = this.testCases[i];
            test = this[methodName];
            try{
                test();
                // TODO: success result
            }catch (e){
                // TODO: determine result (error or failure from assertion)
            }
        }
    }
});